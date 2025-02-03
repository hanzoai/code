/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { CODE_OPEN_SIDEBAR_ACTION_ID } from './sidebarPane.js';


// service that manages sidebar's state
export type CodeSidebarState = {
	isHistoryOpen: boolean;
	currentTab: 'chat';
}

export interface ISidebarStateService {
	readonly _serviceBrand: undefined;

	readonly state: CodeSidebarState; // readonly to the user
	setState(newState: Partial<CodeSidebarState>): void;
	onDidChangeState: Event<void>;

	onDidFocusChat: Event<void>;
	onDidBlurChat: Event<void>;
	fireFocusChat(): void;
	fireBlurChat(): void;
}

export const ISidebarStateService = createDecorator<ISidebarStateService>('codeSidebarStateService');
class CodeSidebarStateService extends Disposable implements ISidebarStateService {
	_serviceBrand: undefined;

	static readonly ID = 'codeSidebarStateService';

	private readonly _onDidChangeState = new Emitter<void>();
	readonly onDidChangeState: Event<void> = this._onDidChangeState.event;

	private readonly _onFocusChat = new Emitter<void>();
	readonly onDidFocusChat: Event<void> = this._onFocusChat.event;

	private readonly _onBlurChat = new Emitter<void>();
	readonly onDidBlurChat: Event<void> = this._onBlurChat.event;


	// state
	state: CodeSidebarState

	constructor(
		@ICommandService private readonly commandService: ICommandService,
	) {
		super()

		// initial state
		this.state = { isHistoryOpen: false, currentTab: 'chat', }
	}


	setState(newState: Partial<CodeSidebarState>) {
		// make sure view is open if the tab changes
		if ('currentTab' in newState) {
			this.commandService.executeCommand(CODE_OPEN_SIDEBAR_ACTION_ID)
		}

		this.state = { ...this.state, ...newState }
		this._onDidChangeState.fire()
	}

	fireFocusChat() {
		this._onFocusChat.fire()
	}

	fireBlurChat() {
		this._onBlurChat.fire()
	}

}

registerSingleton(ISidebarStateService, CodeSidebarStateService, InstantiationType.Eager);
