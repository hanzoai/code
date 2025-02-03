/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { URI } from '../../../../base/common/uri.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';



// service that manages state
export type CodeUriState = {
	currentUri?: URI
}

export interface ICodeUriStateService {
	readonly _serviceBrand: undefined;

	readonly state: CodeUriState; // readonly to the user
	setState(newState: Partial<CodeUriState>): void;
	onDidChangeState: Event<void>;
}

export const ICodeUriStateService = createDecorator<ICodeUriStateService>('codeUriStateService');
class CodeUriStateService extends Disposable implements ICodeUriStateService {
	_serviceBrand: undefined;

	static readonly ID = 'codeUriStateService';

	private readonly _onDidChangeState = new Emitter<void>();
	readonly onDidChangeState: Event<void> = this._onDidChangeState.event;


	// state
	state: CodeUriState

	constructor(
	) {
		super()

		// initial state
		this.state = { currentUri: undefined }
	}

	setState(newState: Partial<CodeUriState>) {

		this.state = { ...this.state, ...newState }
		this._onDidChangeState.fire()
	}


}

registerSingleton(ICodeUriStateService, CodeUriStateService, InstantiationType.Eager);
