#!/usr/bin/env bash

docker run -v `PWD`/src:/src node:8.7.0-alpine node /src/index