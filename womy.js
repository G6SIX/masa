env:  # Global defaults
  PACKAGE_MANAGER_INSTALL: "apt-get update && apt-get install -y"
  MAKEJOBS: "-j10"
  TEST_RUNNER_PORT_MIN: "14000"  # Must be larger than 12321, which is used for the http cache. See https://cirrus-ci.org/guide/writing-tasks/#http-cache
  CCACHE_SIZE: "200M"
  CCACHE_DIR: "/tmp/ccache_dir"
  CCACHE_NOHASHDIR: "1"  # Debug info might contain a stale path if the build dir changes, but this is fine
cirrus_ephemeral_worker_template_env: &CIRRUS_EPHEMERAL_WORKER_TEMPLATE_ENV
  DANGER_RUN_CI_ON_HOST: "1"  # Containers will be discarded after the run, so there is no risk that the ci scripts modify the system
persistent_worker_template_env: &PERSISTENT_WORKER_TEMPLATE_ENV
  RESTART_CI_DOCKER_BEFORE_RUN: "1"
persistent_worker_template: &PERSISTENT_WORKER_TEMPLATE
  persistent_worker: {}  # https://cirrus-ci.org/guide/persistent-workers/
# https://cirrus-ci.org/guide/tips-and-tricks/#sharing-configuration-between-tasks
filter_template: &FILTER_TEMPLATE
  skip: $CIRRUS_REPO_FULL_NAME == "bitcoin-core/gui" && $CIRRUS_PR == ""  # No need to run on the read-only mirror, unless it is a PR. https://cirrus-ci.org/guide/writing-tasks/#conditional-task-execution
  stateful: false  # https://cirrus-ci.org/guide/writing-tasks/#stateful-tasks
base_template: &BASE_TEMPLATE
  << : *FILTER_TEMPLATE
  merge_base_script:
    # Unconditionally install git (used in fingerprint_script) and set the
    # default git author name (used in verify-commits.py)
    - bash -c "$PACKAGE_MANAGER_INSTALL git"
    - git config --global user.email "ci@ci.ci"
    - git config --global user.name "ci"
    - if [ "$CIRRUS_PR" = "" ]; then exit 0; fi
    - git fetch $CIRRUS_REPO_CLONE_URL $CIRRUS_BASE_BRANCH
    - git merge FETCH_HEAD  # Merge base to detect silent merge conflicts
