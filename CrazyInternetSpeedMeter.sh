#!/usr/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
EXTENSION_NAME="CrazyInternetSpeedMeter"
PROJECT_DIR="${PWD}"
SRC_DIR="${PWD}/src"
OUT_DIR="${PWD}/out"
LOG_DIR="${SRC_DIR}/log"
LOG_FILE="${LOG_DIR}/build.log"
METADATA_FILE="${PWD}/src/metadata.json"
MAINTAINER_EMAIL="larryw3i@163.com"
MAINTAINER_DOMAIN_NAME=""
MAINTAINER_NAME="larryw3i"
EXTENSION_REPO_URL="https://github.com/larryw3i/CrazyInternetSpeedMeter"
[[ ${MAINTAINER_DOMAIN_NAME} == "" ]] &&
    EXTENSION_FULL_NAME="${EXTENSION_NAME}@${MAINTAINER_EMAIL/\@/_at_}" ||
    EXTENSION_FULL_NAME="${EXTENSION_NAME}@${MAINTAINER_DOMAIN_NAME}"
POT_FILE="${PWD}/po/${EXTENSION_FULL_NAME}.pot"
DEFAULT_PACK_FILE="${OUT_DIR}/${EXTENSION_FULL_NAME}.shell-extension.zip"

mkdir -p "${LOG_DIR}"
if [[ -f "${LOG_FILE}" ]]; then
    echo '' >>"${LOG_FILE}"
    echo "$(date '+%d/%m/%Y %H:%M:%S')" >>"${LOG_FILE}"
    echo '' >>"${LOG_FILE}"
else
    touch "${LOG_FILE}"
    echo "$(date '+%d/%m/%Y %H:%M:%S')" >>"${LOG_FILE}"
    echo '' >>"${LOG_FILE}"
fi

INSTALL_DIR="${HOME}/.local/share/gnome-shell/extensions"
if [[ "$(id -u)" -eq 0 ]]; then
    chown "${SUDO_USER}":"${SUDO_USER}" -R "${LOG_DIR}"
    INSTALL_DIR="/usr/share/gnome-shell/extensions"
fi

make_test() {
    install_extension
    echo "Start testing. . ."
    dbus-run-session -- gnome-shell --nested --wayland
}

install_extension() {
    pack_extension
    echo "Install ${DEFAULT_PACK_FILE}. . ."
    gnome-extensions \
        install \
        --force \
        ${DEFAULT_PACK_FILE}
    echo "${DEFAULT_PACK_FILE} installed."
}

compile_schemas() {
    PWD0="${PWD}"
    cd ${SRC_DIR}
    glib-compile-schemas schemas/
    cd ${PWD0}
}

update_pot() {
    echo "'xgettext' is extracting translatable strings. . ."
    xgettext \
        -v \
        --from-code=UTF-8 \
        --output=${POT_FILE} \
        --package-name=${EXTENSION_NAME} \
        --package-version=$(jq ".\"version-name\"" ${METADATA_FILE}) \
        src/*.js
    echo "Finish extracting."

    for po_file in $(ls ${PWD}/po/*.po); do
        echo "'msgmerge' is merging ${POT_FILE} to ${po_file}. . ."
        msgmerge \
            --no-location \
            -U \
            ${po_file} \
            ${POT_FILE}
    done
    echo "Finish merging."
}

pack_extension() {
    echo "packing extension. . ."
    update_version_name
    mkdir -p ${OUT_DIR}
    if [[ -f ${DEFAULT_PACK_FILE} ]]; then
        new_extension_zip_file=${DEFAULT_PACK_FILE/.zip/.$(uuid).zip}
        echo "Move ${DEFAULT_PACK_FILE} to ${new_extension_zip_file}"
        mv ${DEFAULT_PACK_FILE} ${new_extension_zip_file}
        echo "Finish moving."
    fi
    # glib-compile-schemas ${SRC_DIR}/schemas/
    compile_schemas
    gnome-extensions pack \
        --podir=${PWD}/po \
        -o ${OUT_DIR} \
        ${SRC_DIR}
    echo "Finish packing."
}

update_version_name() {
    METADATA_FILE_CP=${METADATA_FILE/.json/.0.json}
    jq \
        ".\"version-name\" |= \"$(date -u +%Y%m%d.%H%M)\"" \
        ${METADATA_FILE} \
        >${METADATA_FILE_CP}

    cp ${METADATA_FILE_CP} ${METADATA_FILE}
    diff_test=$(diff ${METADATA_FILE} ${METADATA_FILE_CP})
    if [[ -z ${diff_test} ]]; then
        echo ">> jq . ${METADATA_FILE}"
        jq . ${METADATA_FILE}
        echo "${METADATA_FILE} was updated."
    else
        echo "The operation has been canceled."
    fi
    rm -rf ${METADATA_FILE_CP}
}

update_version() {
    update_version_name
}

# Let's start
if [[ "${1}" == "-b" ]]; then
    # build
    pack_extension
elif [[ "${1}" == "-i" ]]; then
    # pack_extension
    install_extension
    # install
elif [[ "${1}" == "-t" ]]; then
    make_test
else
    ${1}
fi

# The end.
