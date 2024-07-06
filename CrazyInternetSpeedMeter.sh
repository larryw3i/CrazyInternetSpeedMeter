#!/usr/bin/bash

EXTENSION_NAME="CrazyInternetSpeedMeter"
PROJECT_DIR="${PWD}"
SRC_DIR="${PWD}/src"
OUT_DIR="${PWD}/out"
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

debug_extension() {
    install_extension
    echo "Start debugging. . ."
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
    xgettext                    \
        -v                      \
        --from-code=UTF-8       \
        --output=${POT_FILE}    \
        --package-name=${EXTENSION_NAME}                                \
        --package-version=$(jq ".\"version-name\"" ${METADATA_FILE})    \
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

update_version() {
    version0=$(jq .\"version-name\" ${METADATA_FILE})
    version1=$(date -u +%Y%m%d.%H%M%S)
    sed -i "s/${version0}/\"${version1}\"/g" ${METADATA_FILE}
    jq . ${METADATA_FILE}
    echo "${METADATA_FILE} was updated."
}

pack_extension() {
    echo "packing extension. . ."
    update_version
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

# Let's start
if [[ "${1}" == "-b" ]]; then
    # build
    pack_extension
elif [[ "${1}" == "-i" ]]; then
    # pack_extension
    install_extension
    # install
elif [[ "${1}" == "-d" ]]; then
    debug_extension
else
    ${1}
fi

# The end.
