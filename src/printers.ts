//import { V1Pod, V1PodCondition } from '@kubernetes/client-node';
import { V1Pod, V1PodCondition } from './kubernetes_client-node/model/models';

/* printPod is a port of:
func printPod(pod *api.Pod, options printers.GenerateOptions) ([]metav1.TableRow, error)
https://github.com/kubernetes/kubernetes/blob/master/pkg/printers/internalversion/printers.go#L741
*/

const NodeUnreachablePodReason = 'NodeLost';
const zeroDate = new Date(+0);

export enum PodRowColumn {
  name = 'NAME',
  ready = 'READY',
  reason = 'STATUS',
  restarts = 'RESTARTS',
  age = 'AGE',
  ip = 'IP',
  node = 'NODE',
  nominatedNode = 'NOMINATED_NODE',
  readinessGates = 'READINESS_GATES',
  conditions = 'CONDITIONS',
  message = 'MESSAGE',
}

enum PodConditionType {
  PodScheduled = 'PodScheduled',
  PodReady = 'Ready',
  PodInitialized = 'Initialized',
  ContainersReady = 'ContainersReady',
}

enum ConditionStatus {
  ConditionTrue = 'True',
  ConditionFalse = 'False',
  ConditionUnknown = 'Unknown',
}

enum PodPhase {
  PodPending = 'Pending',
  PodRunning = 'Running',
  PodSucceeded = 'Succeeded',
  PodFailed = 'Failed',
  PodUnknown = 'Unknown',
}

export function printPod(pod: V1Pod, now: Date): Map<string, string> {
  let row = new Map<string, string>();
  if (pod === undefined || pod.spec === undefined || pod.status === undefined) {
    return row;
  }

  let restarts = 0;
  let totalContainers = pod.spec.containers.length;
  let readyContainers = 0;
  let lastRestartDate = zeroDate;

  var reason: string;
  var statusMessage: string | undefined;
  reason = String(pod.status.phase);
  statusMessage = pod.status.message;
  if (pod.status.reason !== undefined && pod.status.reason !== '') {
    reason = pod.status.reason;
  }

  let rowCondition = '';
  switch (pod.status.phase) {
    case PodPhase.PodSucceeded:
      rowCondition = `${PodPhase.PodSucceeded}, The pod has completed successfully.`;
      break;
    case PodPhase.PodFailed:
      rowCondition = `${PodPhase.PodFailed}, The pod failed.`;
      break;
    default:
      break;
  }

  let initializing = false;
  if (pod.spec.initContainers !== undefined && pod.status.initContainerStatuses !== undefined) {
    for (let i = 0; i < pod.status.initContainerStatuses.length; i++) {
      const container = pod.status.initContainerStatuses[i];
      restarts += container.restartCount;
      if (container.lastState?.terminated !== undefined) {
        let terminatedDate = container.lastState.terminated.finishedAt;
        if (terminatedDate !== undefined && lastRestartDate < terminatedDate) {
          lastRestartDate = terminatedDate;
        }
      }
      if (container.state?.terminated !== undefined && container.state.terminated.exitCode === 0) {
        continue;
      } else if (container.state?.terminated !== undefined) {
        // initialization is failed
        if (container.state.terminated.reason === undefined || container.state.terminated.reason.length === 0) {
          if (container.state.terminated.signal !== undefined && container.state.terminated.signal !== 0) {
            reason = 'Init:Signal:' + container.state.terminated.signal;
          } else {
            reason = 'Init:ExitCode:' + container.state.terminated.exitCode;
          }
        } else {
          reason = 'Init:' + container.state.terminated.reason;
        }
        statusMessage =
          container.state.terminated.message !== undefined
            ? `Terminated: ${container.state.terminated.message}`
            : container.state.terminated.exitCode !== 0
            ? `Terminated: exit(${container.state.terminated.exitCode})`
            : undefined;
        initializing = true;
      } else if (
        container.state?.waiting !== undefined &&
        container.state.waiting.reason !== undefined &&
        container.state.waiting.reason.length > 0 &&
        container.state.waiting.reason !== 'PodInitializing'
      ) {
        reason = 'Init:' + container.state.waiting.reason;
        statusMessage =
          container.state.waiting.message !== undefined ? `Waiting: ${container.state.waiting.message}` : 'Waiting';
        initializing = true;
      } else {
        reason = 'Init:' + i + '/' + pod.spec.initContainers.length;
        statusMessage = undefined;
        initializing = true;
      }
      break;
    }
  }

  if (!initializing) {
    restarts = 0;
    let hasRunning = false;
    if (pod.status.containerStatuses !== undefined) {
      for (let i = pod.status.containerStatuses.length - 1; i >= 0; i--) {
        const container = pod.status.containerStatuses[i];

        restarts += container.restartCount;
        if (container.lastState?.terminated !== undefined) {
          let terminatedDate = container.lastState.terminated.finishedAt;
          if (terminatedDate !== undefined && lastRestartDate < terminatedDate) {
            lastRestartDate = terminatedDate;
          }
        }
        if (container.state?.waiting?.reason !== undefined && container.state.waiting.reason !== '') {
          reason = container.state.waiting.reason;
          statusMessage =
            container.state.waiting.message !== undefined ? `Waiting: ${container.state.waiting.message}` : 'Waiting';
        } else if (container.state?.terminated?.reason !== undefined && container.state.terminated.reason !== '') {
          reason = container.state.terminated.reason;
          statusMessage =
            container.state.terminated.message !== undefined
              ? `Terminated: ${container.state.terminated.message}`
              : container.state.terminated.exitCode !== 0
              ? `Terminated: exit(${container.state.terminated.exitCode})`
              : undefined;
        } else if (container.state?.terminated !== undefined && container.state.terminated.reason !== '') {
          if (container.state.terminated.signal !== undefined && container.state.terminated.signal !== 0) {
            reason = 'Signal:' + container.state.terminated.signal;
          } else {
            reason = 'ExitCode:' + container.state.terminated.exitCode;
          }
          statusMessage =
            container.state.terminated.message !== undefined
              ? `Terminated: ${container.state.terminated.message}`
              : container.state.terminated.exitCode !== 0
              ? `Terminated: exit(${container.state.terminated.exitCode})`
              : undefined;
        } else if (container.ready && container.state?.running !== undefined) {
          hasRunning = true;
          readyContainers++;
        }
      }

      // change pod status back to "Running" if there is at least one container still reporting as "Running" status
      if (reason === 'Completed' && hasRunning) {
        if (pod.status.conditions !== undefined && hasPodReadyCondition(pod.status.conditions)) {
          reason = 'Running';
        } else {
          reason = 'NotReady';
        }
      }
    }
  }

  if (pod.metadata?.deletionTimestamp !== undefined && pod.status.reason === NodeUnreachablePodReason) {
    reason = 'Unknown';
    statusMessage = pod.status.message;
  } else if (pod.metadata?.deletionTimestamp !== undefined) {
    reason = 'Terminating';
    statusMessage = pod.status.message;
  }

  let restartsStr = String(restarts);
  if (lastRestartDate !== zeroDate) {
    const ago = translateTimestampSince(lastRestartDate, now);
    restartsStr = `${restarts} (${ago} ago)`;
  }

  row.set(PodRowColumn.name, String(pod.metadata?.name));
  row.set(PodRowColumn.ready, `${readyContainers}/${totalContainers}`);
  row.set(PodRowColumn.reason, reason);
  row.set(PodRowColumn.message, statusMessage === undefined ? '<none>' : statusMessage);
  row.set(PodRowColumn.restarts, restartsStr);
  row.set(PodRowColumn.age, translateTimestampSince(pod.metadata?.creationTimestamp, now));

  const nodeName = pod.spec.nodeName === undefined ? '<none>' : pod.spec.nodeName;
  const nominatedNodeName = pod.status.nominatedNodeName === undefined ? '<none>' : pod.status.nominatedNodeName;
  const podIP =
    pod.status.podIPs === undefined || pod.status.podIPs.length === 0 || pod.status.podIPs[0].ip === undefined
      ? '<none>'
      : pod.status.podIPs[0].ip;

  let readinessGates = '<none>';
  if (pod.spec.readinessGates !== undefined && pod.spec.readinessGates.length > 0) {
    let trueConditions = 0;
    for (let r = 0; r < pod.spec.readinessGates.length; r++) {
      const readinessGate = pod.spec.readinessGates[r];
      const conditionType = readinessGate.conditionType;
      if (pod.status.conditions !== undefined) {
        for (let c = 0; c < pod.status.conditions.length; c++) {
          const condition = pod.status.conditions[c];
          if (condition.type === conditionType) {
            if (condition.status === ConditionStatus.ConditionTrue) {
              trueConditions++;
            }
            break;
          }
        }
      }
    }
    readinessGates = `${trueConditions}/${pod.spec.readinessGates.length}`;
  }
  row.set(PodRowColumn.ip, podIP);
  row.set(PodRowColumn.node, nodeName);
  row.set(PodRowColumn.nominatedNode, nominatedNodeName);
  row.set(PodRowColumn.readinessGates, readinessGates);
  row.set(PodRowColumn.conditions, rowCondition);

  return row;
}

function translateTimestampSince(timestamp: Date | undefined, now: Date): string {
  if (timestamp === undefined || timestamp === zeroDate) {
    return '<unknown>';
  }

  return humanDuration(now.getTime() - timestamp.getTime());
}

function humanDuration(duration: number): string {
  let seconds = (duration / 1000) | 0;
  if (seconds < -1) {
    return '<invalid>';
  } else if (seconds < 0) {
    return '0s';
  } else if (seconds < 60) {
    return `${seconds}s`;
  }
  let minutes = (seconds / 60) | 0;
  seconds %= 60;
  if (minutes < 60) {
    return `${minutes}m${seconds}s`;
  }
  let hours = (minutes / 60) | 0;
  minutes %= 60;
  if (hours < 24) {
    return `${hours}h${minutes}m`;
  }
  let days = (hours / 24) | 0;
  hours %= 24;
  if (days < 365) {
    return `${days}d${hours}h`;
  }
  const years = (days / 365) | 0;
  days %= 365;
  return `${years}y${days}d`;
}

function hasPodReadyCondition(conditions: V1PodCondition[]): boolean {
  for (let c = 0; c < conditions.length; c++) {
    const condition = conditions[c];
    if (condition.type === PodConditionType.PodReady && condition.status === ConditionStatus.ConditionTrue) {
      return true;
    }
  }

  return false;
}
