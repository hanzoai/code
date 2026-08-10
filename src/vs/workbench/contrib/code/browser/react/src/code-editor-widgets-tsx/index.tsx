/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { mountFnGenerator } from '../util/mountFnGenerator.js'
import { CodeCommandBarMain } from './CodeCommandBar.js'
import { CodeSelectionHelperMain } from './CodeSelectionHelper.js'

export const mountCodeCommandBar = mountFnGenerator(CodeCommandBarMain)

export const mountCodeSelectionHelper = mountFnGenerator(CodeSelectionHelperMain)

