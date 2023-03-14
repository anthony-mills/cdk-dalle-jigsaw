#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DalleImgStack } from '../lib/dalleimg-stack';

const app = new cdk.App();
new DalleImgStack(app, 'DalleImgStack', {});