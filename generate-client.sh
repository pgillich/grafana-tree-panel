#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail

cd "$(dirname "$0")"

. settings

export GEN_ROOT="${GEN_ROOT:-/tmp/gen_root}"

if [[ ! -d ${GEN_ROOT} ]]; then
    : "${GEN_COMMIT?Need to set GEN_COMMIT to kubernetes-client/gen commit}"

    echo ">>> Cloning gen repo"
    git clone --recursive https://github.com/kubernetes-client/gen.git "${GEN_ROOT}"
    (cd ${GEN_ROOT} && git checkout ${GEN_COMMIT})
else
    echo ">>> Reusing gen repo at ${GEN_ROOT}"
fi

TYPESCRIPT="${GEN_ROOT}/openapi/typescript.sh"
echo ">>> Running ${TYPESCRIPT}"
${TYPESCRIPT} tmp settings
echo ">>> Done."

CLIENT_TARGET=src/kubernetes_client-node
rm -rf ${CLIENT_TARGET}/model
mkdir -p ${CLIENT_TARGET}/model
cp -r tmp/model ${CLIENT_TARGET}/
find ${CLIENT_TARGET}/model -name '*.ts' -exec sed -i "s#^import { RequestFile } from './models';\$##g" {} \;
npx eslint --fix -c node_modules/@grafana/toolkit/src/config/eslint.plugin.js ${CLIENT_TARGET}/model/*.ts
