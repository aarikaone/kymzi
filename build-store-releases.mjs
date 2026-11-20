#!/usr/bin/env node
import {cli} from './scripts/build-mobile.mjs';
await cli(['stores',...process.argv.slice(2)]);
