# This is larrw3i's script.

pyvenv0_path="${HOME}/pyvenv0"
nodeenv0_path="${HOME}/nodeenv0"
pip_conf_path="${HOME}/.config/pip/pip.conf"
make_venv(){
    [[ ! -d ${pyvenv0_path} ]] \
    &&  python3 -m venv ${pyvenv0_path}

    . ${pyvenv0_path}/bin/activate

    [[ ! -f ${pip_conf_path} ]] \
    && pip config \
        set \
        global.index-url \
        https://mirrors.bfsu.edu.cn/pypi/web/simple

    [[ ! -f "${pyvenv0_path}/bin/nodeenv" ]] \
    && pip3 install -U nodeenv

    [[ ! -d ${nodeenv0_path} ]] \
    && nodeenv ${nodeenv0_path}

    . ${nodeenv0_path}/bin/activate

    [[ $(npm config get registry --global) == "undefined" ]] \
    && npm config set registry https://registry.npmmirror.com
}

$1

# The end.
