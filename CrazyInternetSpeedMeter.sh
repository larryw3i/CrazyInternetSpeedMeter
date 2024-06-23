#!/usr/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
# SRC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
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

if [[ $(whoami) == "larry" ]]; then
    . ${PWD}/Scripts/CrazyInternetSpeedMeter.larryw3i.sh

    make_venv
fi

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

# print <arg>
print() {
    echo -e "${NC}[+] ${1}${NC}"
    echo -e "[+] ${1}" &>>"$LOG_FILE"
}

# print_warning <arg>
print_warning() {
    echo -e "${NC}[${YELLOW}!${NC}] ${1}${NC}"
    echo -e "[!] ${1}" &>>"$LOG_FILE"
}

# print_failed <arg>
print_failed() {
    echo -e "${NC}[${RED}x${NC}] ${1}${NC}"
    echo -e "[x] ${1}" &>>"$LOG_FILE"
}

# print_success <arg>
print_success() {
    echo -e "${NC}[${GREEN}\xE2\x9C\x94${NC}] ${1}${NC}"
    echo -e "[✔] ${1}" &>>"$LOG_FILE"
}

# print_suggestion <arg>
print_suggestion() {
    echo -e "${NC}[${BLUE}#${NC}] ${1}${NC}"
    echo -e "[#] ${1}" &>>"$LOG_FILE"
}

# is_failed <success_message> <failed_message>
is_failed() {
    if [[ "$?" -eq 0 ]]; then
        print_success "${1}"
    else
        print_failed "${2}"
    fi
}

# is_warning <success_message> <warning_message>
is_warning() {
    if [[ "$?" -eq 0 ]]; then
        print_success "${1}"
    else
        print_warning "${2}"
    fi
}

make_test() {
    install_extension
    echo "Start testing. . ."
    # export G_MESSAGES_DEBUG=backtrace-segfaults
    export MUTTER_DEBUG_DUMMY_MODE_SPECS=1366x768
    # export SHELL_DEBUG=backtrace-warnings
    export SHELL_DEBUG=backtrace-segfaults
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

# install extension
install_v0() {
    print "Installing to ${INSTALL_DIR}"
    update_version_name
    # compile_schemas
    mkdir -p "${INSTALL_DIR}"
    rm -rf "${INSTALL_DIR}/${EXTENSION_FULL_NAME}"
    cp \
        -rf \
        "${SRC_DIR}" \
        "${INSTALL_DIR}/${EXTENSION_FULL_NAME}" \
        &>>"$LOG_FILE"
    is_failed \
        "Done" \
        "Skipping: Can not install to ${INSTALL_DIR}. See log for more info."
}

# build for release
build() {
    print "Creating ${EXTENSION_FULL_NAME}.zip"
    update_version_name
    mkdir -p "${OUT_DIR}"
    zip \
        -6rXj \
        "${OUT_DIR}/${EXTENSION_FULL_NAME}.zip" \
        "${SRC_DIR}" \
        &>>"$LOG_FILE"
    is_failed \
        "Done" \
        "Skipping: Creating zip is failed. See log for more info."
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
    # cp ${METADATA_FILE} ${METADATA_FILE_CP}
    jq \
        ".\"version-name\" |= \"$(date -u +%Y%m%d.%H%M)\"" \
        ${METADATA_FILE} \
        >${METADATA_FILE_CP}
    # jq \
    #     ".\"version\" |= \"$(date +%Y%m%d.%H%M)\"" \
    #     ${METADATA_FILE_CP} \
    #     >${METADATA_FILE_CP}

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
