#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit
# Executes cleanup function at script exit.
trap cleanup EXIT

testrpc=/usr/bin/testrpc
# FIXME: 'gasLimit=0x3d0900         #4,000,000' ???
gasLimit=0xfffffffffff
testrpc_port=8545

testrpc_running() {
  nc -z localhost "$testrpc_port"
}

if testrpc_running; then
  echo "Using existing testrpc instance"
else
  echo "Starting our own testrpc instance..."
  echo
  echo "******** Run in another terminal:"
  echo "geth attach http://127.0.0.1:8545"
  echo
  # We define 10 accounts with balance 1M ether, needed for high-value tests.
  accounts=(
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501204,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501205,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501206,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501207,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501208,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501209,1000000000000000000000000"
  )

  $testrpc --gasLimit "${gasLimit}" --port "${testrpc_port}" "${accounts[@]}"

fi

cleanup() {
  echo
  echo  "cleaning..."
}
