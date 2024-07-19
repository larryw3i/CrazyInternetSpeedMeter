#!/usr/bin/bash

METADATA_FILE="${PWD}/src/metadata.json"
EXTENSION_FULL_NAME=$(
    jq \
        .uuid \
        ${METADATA_FILE} |
        tail -c+2 |
        head -c-2
)
EXTENSION_NAME=$(
    echo ${EXTENSION_FULL_NAME} |
        cut \
            -d '@' \
            -f1
)
VERSION=$(
    jq ".\"version-name\"" \
        ${METADATA_FILE}
)
PROJECT_DIR="${PWD}"
SRC_DIR="${PWD}/src"
OUT_DIR="${PWD}/out"
TEMP_DIR="${PWD}/tmp"
MAINTAINER_EMAIL="larryw3i@163.com"
MAINTAINER_NAME="larryw3i"
EXTENSION_REPO_URL="https://github.com/larryw3i/CrazyInternetSpeedMeter"
POT_FILE="${PWD}/po/${EXTENSION_FULL_NAME}.pot"
DEFAULT_PACK_FILE="${OUT_DIR}/${EXTENSION_FULL_NAME}.shell-extension.zip"
EXTENSIONS_DIR="${HOME}/.local/share/gnome-shell/extensions"
EXTENSION_DIR="${EXTENSIONS_DIR}/${EXTENSION_FULL_NAME}"
EXTENSION_DIR_CP="${TEMP_DIR}/${EXTENSION_FULL_NAME}"

restore_site_extension() {
    if [[ -d ${EXTENSION_DIR_CP} ]]; then
        echo "Site extension copy exists."
        echo "Move \"${EXTENSION_DIR_CP}\" to \"${EXTENSION_DIR}\"."
        mv ${EXTENSION_DIR_CP} ${EXTENSION_DIR}
        rm -rf ${EXTENSION_DIR_CP}
        echo "done."
    fi
}

copy_site_extension() {
    if [[ ! -d ${TEMP_DIR} ]]; then
        mkdir -p ${TEMP_DIR}
    fi
    if [[ -d ${EXTENSION_DIR} ]]; then
        echo "Site extension exists."
        echo "Move \"${EXTENSION_DIR}\" to \"${EXTENSION_DIR_CP}\"."
        mv ${EXTENSION_DIR} ${EXTENSION_DIR_CP}
        echo "done."
    fi
}

debug_extension() {
    copy_site_extension
    install_extension
    echo "Start debugging. . ."
    dbus-run-session \
        -- \
        gnome-shell \
        --nested \
        --wayland
    restore_site_extension
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
    version="${VERSION}"
    xgettext \
        -v \
        --from-code=UTF-8 \
        --output=${POT_FILE} \
        --package-name=${EXTENSION_NAME} \
        --package-version=${version} \
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
    version0="${VERSION}"
    version1=$(date -u +%Y%m%d.%H%M%S)
    sed -i "s/${version0}/\"${version1}\"/g" ${METADATA_FILE}
    jq . ${METADATA_FILE}
    echo "${METADATA_FILE} was updated."
    VERSION=${version1}
}

pack_extension() {
    echo "packing extension. . ."
    update_version
    mkdir -p ${OUT_DIR}
    if [[ -f ${DEFAULT_PACK_FILE} ]]; then
        extension_cp=${DEFAULT_PACK_FILE/.zip/.$(uuid).zip}
        echo "Move ${DEFAULT_PACK_FILE} to ${extension_cp}"
        mv ${DEFAULT_PACK_FILE} ${extension_cp}
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

fmt_code() {
    npx prettier --write .
    shfmt -i 4 -w -f .
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
