/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { ProxyChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IMainProcessService } from '../../../../platform/ipc/common/mainProcessService.js';
import { VoidCheckUpdateRespose } from './voidUpdateServiceTypes.js';



export interface ICodeUpdateService {
	readonly _serviceBrand: undefined;
	check: (explicit: boolean) => Promise<VoidCheckUpdateRespose>;
}


export const ICodeUpdateService = createDecorator<ICodeUpdateService>('CodeUpdateService');


// implemented by calling channel
export class CodeUpdateService implements ICodeUpdateService {

	readonly _serviceBrand: undefined;
	private readonly codeUpdateService: ICodeUpdateService;

	constructor(
		@IMainProcessService mainProcessService: IMainProcessService, // (only usable on client side)
	) {
		// creates an IPC proxy to use metricsMainService.ts
		this.codeUpdateService = ProxyChannel.toService<ICodeUpdateService>(mainProcessService.getChannel('code-channel-update'));
	}


	// anything transmitted over a channel must be async even if it looks like it doesn't have to be
	check: ICodeUpdateService['check'] = async () => {
		const res = await this.codeUpdateService.check()
		return res
	}
}

registerSingleton(ICodeUpdateService, CodeUpdateService, InstantiationType.Eager);


