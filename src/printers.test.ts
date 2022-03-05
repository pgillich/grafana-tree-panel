import fs from 'fs';
import { ObjectSerializer, V1Pod } from '@kubernetes/client-node';
import { printPod, PodRowColumn } from 'printers';

describe('printPod', () => {
  const now = new Date(Date.UTC(2022, 1, 20, 8, 0, 0));

  it('ErrImagePull', () => {
    const pod = loadPod('test/pod-status/ErrImagePull.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'tester'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'ErrImagePull'],
      [
        PodRowColumn.message,
        'rpc error: code = Unknown desc = Requesting bear token: invalid status code from registry 403 (Forbidden)',
      ],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '1d16h'],
      [PodRowColumn.ip, '10.92.118.250'],
      [PodRowColumn.node, 'o-ci-01'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('ImageInspectError', () => {
    const pod = loadPod('test/pod-status/ImageInspectError.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'ksniff-8ljgd'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'ImageInspectError'],
      [
        PodRowColumn.message,
        'Failed to inspect image "maintained/tcpdump": rpc error: code = Unknown desc = short-name "maintained/tcpdump:latest" did not resolve to an alias and no unqualified-search registries are defined in "/etc/containers/registries.conf.d/01-unqualified.conf"',
      ],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '2d19h'],
      [PodRowColumn.ip, '10.92.81.12'],
      [PodRowColumn.node, 'o-k8s-vps1'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('ImagePullBackOff', () => {
    const pod = loadPod('test/pod-status/ImagePullBackOff.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'tester'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'ImagePullBackOff'],
      [PodRowColumn.message, 'Back-off pulling image "git.local:7077/product/docker/tool/k8s-init-container:latest"'],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '1d16h'],
      [PodRowColumn.ip, '10.92.118.250'],
      [PodRowColumn.node, 'o-ci-01'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Error', () => {
    const pod = loadPod('test/pod-status/Error.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'nodelocaldns-krt85'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'Error'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '3'],
      [PodRowColumn.age, '136d18h'],
      [PodRowColumn.ip, '10.90.2.3'],
      [PodRowColumn.node, 'hu2-vmp3'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('ContainerCreating', () => {
    const pod = loadPod('test/pod-status/ContainerCreating.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'mysql-564d57cc47-qmlwp'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'ContainerCreating'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '9d23h'],
      [PodRowColumn.ip, '<none>'],
      [PodRowColumn.node, 'hu2-vmp9'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('CrashLoopBackOff', () => {
    const pod = loadPod('test/pod-status/CrashLoopBackOff.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'longhorn-driver-deployer-69985cff47-zrr68'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'CrashLoopBackOff'],
      [
        PodRowColumn.message,
        'back-off 5m0s restarting failed container=longhorn-driver-deployer pod=longhorn-driver-deployer-69985cff47-zrr68_longhorn-system(0233ba8a-69bc-428d-8e2c-aec03cb5b146)',
      ],
      [PodRowColumn.restarts, '3778 (7m42s ago)'],
      [PodRowColumn.age, '18d23h'],
      [PodRowColumn.ip, '10.92.92.14'],
      [PodRowColumn.node, 'hu2-vmp9'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Terminating', () => {
    const pod = loadPod('test/pod-status/Terminating.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'coredns-8474476ff8-m8xzl'],
      [PodRowColumn.ready, '1/1'],
      [PodRowColumn.reason, 'Terminating'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '33d19h'],
      [PodRowColumn.ip, '10.92.124.218'],
      [PodRowColumn.node, 'hu2-vmp3'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Terminating2', () => {
    const pod = loadPod('test/pod-status/Terminating2.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'percona-server-mongodb-operator-7d76d4844d-2wjwv'],
      [PodRowColumn.ready, '2/2'],
      [PodRowColumn.reason, 'Terminating'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '1 (103d16h ago)'],
      [PodRowColumn.age, '103d16h'],
      [PodRowColumn.ip, '10.92.124.5'],
      [PodRowColumn.node, 'hu2-vmp3'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Running', () => {
    const pod = loadPod('test/pod-status/Running.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'coredns-8474476ff8-lfwcf'],
      [PodRowColumn.ready, '1/1'],
      [PodRowColumn.reason, 'Running'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '103d16h'],
      [PodRowColumn.ip, '10.92.86.76'],
      [PodRowColumn.node, 'hu2-vmp6'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Running2', () => {
    const pod = loadPod('test/pod-status/Running2.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'node-exporter-s6tbv'],
      [PodRowColumn.ready, '2/2'],
      [PodRowColumn.reason, 'Running'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '6 (32d20h ago)'],
      [PodRowColumn.age, '127d23h'],
      [PodRowColumn.ip, '10.90.2.9'],
      [PodRowColumn.node, 'hu2-vmp9'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Running3', () => {
    const pod = loadPod('test/pod-status/Running3.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'blackbox-exporter-6798fb5bb4-rb6qc'],
      [PodRowColumn.ready, '3/3'],
      [PodRowColumn.reason, 'Running'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '18d23h'],
      [PodRowColumn.ip, '10.92.86.166'],
      [PodRowColumn.node, 'hu2-vmp6'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Completed', () => {
    const pod = loadPod('test/pod-status/Completed.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'secret-generator--1-jvbz8'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'Completed'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '25d14h'],
      [PodRowColumn.ip, '10.92.92.119'],
      [PodRowColumn.node, 'hu2-vmp9'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, 'Succeeded, The pod has completed successfully.'],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('PodInitializing', () => {
    const pod = loadPod('test/pod-status/PodInitializing.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'my-nginx-5997694d7b-vfvff'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'Init:0/1'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '2d19h'],
      [PodRowColumn.ip, '<none>'],
      [PodRowColumn.node, 'demo-worker'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '0/1'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Init_CrashLoopBackOff', () => {
    const pod = loadPod('test/pod-status/Init_CrashLoopBackOff.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'kratos-6c76994b97-gstzr'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'Init:CrashLoopBackOff'],
      [
        PodRowColumn.message,
        'back-off 5m0s restarting failed container=database-setup pod=kratos-6c76994b97-gstzr_account-vf-test-int(a7845403-9a24-4d2c-b959-4d7a2e172036)',
      ],
      [PodRowColumn.restarts, '5345 (6m54s ago)'],
      [PodRowColumn.age, '18d23h'],
      [PodRowColumn.ip, '10.92.92.184'],
      [PodRowColumn.node, 'hu2-vmp9'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Init_ImagePullBackOff', () => {
    const pod = loadPod('test/pod-status/Init_ImagePullBackOff.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'my-nginx-68cd7d56f4-8h2m5'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'Init:ErrImagePull'],
      [
        PodRowColumn.message,
        'rpc error: code = NotFound desc = failed to pull and unpack image "docker.io/library/busybox:bad-version": failed to resolve reference "docker.io/library/busybox:bad-version": docker.io/library/busybox:bad-version: not found',
      ],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '2d20h'],
      [PodRowColumn.ip, '10.244.2.6'],
      [PodRowColumn.node, 'demo-worker'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Init_Running', () => {
    const pod = loadPod('test/pod-status/Init_Running.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'my-nginx-7764d469c9-7wsmh'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'Init:0/1'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '2d20h'],
      [PodRowColumn.ip, '10.244.2.7'],
      [PodRowColumn.node, 'demo-worker'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });

  it('Init_Terminating', () => {
    const pod = loadPod('test/pod-status/Init_Terminating.json');
    const expected = new Map<string, string>([
      [PodRowColumn.name, 'my-nginx-7764d469c9-7wsmh'],
      [PodRowColumn.ready, '0/1'],
      [PodRowColumn.reason, 'Terminating'],
      [PodRowColumn.message, '<none>'],
      [PodRowColumn.restarts, '0'],
      [PodRowColumn.age, '2d20h'],
      [PodRowColumn.ip, '10.244.2.7'],
      [PodRowColumn.node, 'demo-worker'],
      [PodRowColumn.nominatedNode, '<none>'],
      [PodRowColumn.readinessGates, '<none>'],
      [PodRowColumn.conditions, ''],
    ]);

    const row = printPod(pod, now);

    expect(row).toEqual(expected);
  });
});

function loadPod(path: string): V1Pod {
  const pod = ObjectSerializer.deserialize(JSON.parse(String(fs.readFileSync(path))), 'V1Pod');
  expect(pod.kind).toEqual('Pod');
  return pod;
}
