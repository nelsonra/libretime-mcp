#!/usr/bin/env node
import { randomBytes } from 'crypto'
console.log(randomBytes(32).toString('hex'))
