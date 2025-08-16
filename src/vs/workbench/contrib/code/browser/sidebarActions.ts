/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';


import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';

import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';

import { ICodeEditorService } from '../../../../editor/browser/services/codeEditorService.js';
import { IRange } from '../../../../editor/common/core/range.js';
import { ITextModel } from '../../../../editor/common/model.js';
import { CODE_VIEW_CONTAINER_ID, CODE_VIEW_ID } from './sidebarPane.js';
import { IMetricsService } from '../../../../platform/void/common/metricsService.js';
import { ISidebarStateService } from './sidebarStateService.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { CODE_TOGGLE_SETTINGS_ACTION_ID } from './codeSettingsPane.js';
import { CODE_CTRL_L_ACTION_ID } from './actionIDs.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { ICodeEditor } from '../../../../editor/browser/editorBrowser.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { localize2 } from '../../../../nls.js';
import { IChatThreadService } from './chatThreadService.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { ICodeUriStateService } from './codeUriStateService.js';

// ---------- Register commands and keybindings ----------


export const roundRangeToLines = (range: IRange | null | undefined, options: { emptySelectionBehavior: 'null' | 'line' }) => {
	if (!range)
		return null

	// treat as no selection if selection is empty
	if (range.endColumn === range.startColumn && range.endLineNumber === range.startLineNumber) {
		if (options.emptySelectionBehavior === 'null')
			return null
		else if (options.emptySelectionBehavior === 'line')
			return { startLineNumber: range.startLineNumber, startColumn: 1, endLineNumber: range.startLineNumber, endColumn: 1 }
	}

	// IRange is 1-indexed
	const endLine = range.endColumn === 1 ? range.endLineNumber - 1 : range.endLineNumber // e.g. if the user triple clicks, it selects column=0, line=line -> column=0, line=line+1
	const newRange: IRange = {
		startLineNumber: range.startLineNumber,
		startColumn: 1,
		endLineNumber: endLine,
		endColumn: Number.MAX_SAFE_INTEGER
	}
	return newRange
}

// const getContentInRange = (model: ITextModel, range: IRange | null) => {
// 	if (!range)
// 		return null
// 	const content = model.getValueInRange(range)
// 	const trimmedContent = content
// 		.replace(/^\s*\n/g, '') // trim pure whitespace lines from start
// 		.replace(/\n\s*$/g, '') // trim pure whitespace lines from end
// 	return trimmedContent
// }



const CODE_OPEN_SIDEBAR_ACTION_ID = 'void.sidebar.open'
registerAction2(class extends Action2 {
	constructor() {
		super({ id: CODE_OPEN_SIDEBAR_ACTION_ID, title: localize2('voidOpenSidebar', 'Code: Open Sidebar'), f1: true });
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const viewsService = accessor.get(IViewsService)
		const chatThreadsService = accessor.get(IChatThreadService)
		viewsService.openViewContainer(VOID_VIEW_CONTAINER_ID)
		await chatThreadsService.focusCurrentChat()
	}
})




// Action: when press ctrl+L, show the sidebar chat and add to the selection
const CODE_ADD_SELECTION_TO_SIDEBAR_ACTION_ID = 'void.sidebar.select'
registerAction2(class extends Action2 {
	constructor() {
		super({ id: CODE_ADD_SELECTION_TO_SIDEBAR_ACTION_ID, title: localize2('voidAddToSidebar', 'Code: Add Selection to Sidebar'), f1: true });
	}
	async run(accessor: ServicesAccessor): Promise<void> {

		const model = accessor.get(ICodeEditorService).getActiveCodeEditor()?.getModel()
		if (!model)
			return

		const metricsService = accessor.get(IMetricsService)
		const editorService = accessor.get(ICodeEditorService)

		metricsService.capture('Ctrl+L', {})

		const editor = editorService.getActiveCodeEditor()
		// accessor.get(IEditorService).activeTextEditorControl?.getSelection()
		const selectionRange = roundRangeToLines(editor?.getSelection(), { emptySelectionBehavior: 'null' })


		// select whole lines
		if (selectionRange) {
			editor?.setSelection({ startLineNumber: selectionRange.startLineNumber, endLineNumber: selectionRange.endLineNumber, startColumn: 1, endColumn: Number.MAX_SAFE_INTEGER })
		}

		const selectionStr = getContentInRange(model, selectionRange)

		const selection: StagingSelectionItem = !selectionRange || !selectionStr || (selectionRange.startLineNumber > selectionRange.endLineNumber) ? {
			type: 'File',
			fileURI: model.uri,
			selectionStr: null,
			range: null,
		} : {
			type: 'Selection',
			fileURI: model.uri,
			selectionStr: selectionStr,
			range: selectionRange,
		}

		// add selection to staging
		const chatThreadService = accessor.get(IChatThreadService)
		const currentStaging = chatThreadService.state.currentStagingSelections
		const currentStagingEltIdx = currentStaging?.findIndex(s =>
			s.fileURI.fsPath === model.uri.fsPath
			&& s.range?.startLineNumber === selection.range?.startLineNumber
			&& s.range?.endLineNumber === selection.range?.endLineNumber
		)

		// if matches with existing selection, overwrite
		if (currentStagingEltIdx !== undefined && currentStagingEltIdx !== -1) {
			chatThreadService.setStaging([
				...currentStaging!.slice(0, currentStagingEltIdx),
				selection,
				...currentStaging!.slice(currentStagingEltIdx + 1, Infinity)
			])
		}
		// if no match, add
		else {
			chatThreadService.setStaging([...(currentStaging ?? []), selection])
		}

	}
});


registerAction2(class extends Action2 {
	constructor() {
		super({
			id: CODE_CTRL_L_ACTION_ID,
			f1: true,
			title: localize2('voidCtrlL', 'Code: Add Select to Chat'),
			keybinding: {
				primary: KeyMod.CtrlCmd | KeyCode.KeyL,
				weight: KeybindingWeight.CodeExtension
			}
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		// Get services
		const commandService = accessor.get(ICommandService)
		await commandService.executeCommand(CODE_OPEN_SIDEBAR_ACTION_ID)
		await commandService.executeCommand(CODE_ADD_SELECTION_TO_SIDEBAR_ACTION_ID)
	}
})


// New chat keybind + menu button
const VOID_CMD_SHIFT_L_ACTION_ID = 'void.cmdShiftL'
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: VOID_CMD_SHIFT_L_ACTION_ID,
			title: 'New Chat',
			keybinding: {
				primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyL,
				weight: KeybindingWeight.VoidExtension,
			},
			icon: { id: 'add' },
			menu: [{ id: MenuId.ViewTitle, group: 'navigation', when: ContextKeyExpr.equals('view', CODE_VIEW_ID), }]
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {

		const metricsService = accessor.get(IMetricsService)
		const chatThreadsService = accessor.get(IChatThreadService)
		const editorService = accessor.get(ICodeEditorService)
		metricsService.capture('Chat Navigation', { type: 'Start New Chat' })

		// get current selections and value to transfer
		const oldThreadId = chatThreadsService.state.currentThreadId
		const oldThread = chatThreadsService.state.allThreads[oldThreadId]

		const oldUI = await oldThread?.state.mountedInfo?.whenMounted

		const oldSelns = oldThread?.state.stagingSelections
		const oldVal = oldUI?.textAreaRef?.current?.value

		// open and focus new thread
		chatThreadsService.openNewThread()
		await chatThreadsService.focusCurrentChat()


		// set new thread values
		const newThreadId = chatThreadsService.state.currentThreadId
		const newThread = chatThreadsService.state.allThreads[newThreadId]

		const newUI = await newThread?.state.mountedInfo?.whenMounted
		chatThreadsService.setCurrentThreadState({ stagingSelections: oldSelns, })
		if (newUI?.textAreaRef?.current && oldVal) newUI.textAreaRef.current.value = oldVal


		// if has selection, add it
		const editor = editorService.getActiveCodeEditor()
		const model = editor?.getModel()
		if (!model) return
		const selectionRange = roundRangeToLines(editor?.getSelection(), { emptySelectionBehavior: 'null' })
		if (!selectionRange) return
		editor?.setSelection({ startLineNumber: selectionRange.startLineNumber, endLineNumber: selectionRange.endLineNumber, startColumn: 1, endColumn: Number.MAX_SAFE_INTEGER })
		chatThreadsService.addNewStagingSelection({
			type: 'CodeSelection',
			uri: model.uri,
			language: model.getLanguageId(),
			range: [selectionRange.startLineNumber, selectionRange.endLineNumber],
			state: { wasAddedAsCurrentFile: false },
		})
	}
})

// History menu button
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'void.historyAction',
			title: 'View Past Chats',
			icon: { id: 'history' },
			menu: [{ id: MenuId.ViewTitle, group: 'navigation', when: ContextKeyExpr.equals('view', CODE_VIEW_ID), }]
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {

		// do not do anything if there are no messages (without this it clears all of the user's selections if the button is pressed)
		// TODO the history button should be disabled in this case so we can remove this logic
		const thread = accessor.get(IChatThreadService).getCurrentThread()
		if (thread.messages.length === 0) {
			return;
		}

		const metricsService = accessor.get(IMetricsService)

		const commandService = accessor.get(ICommandService)

		metricsService.capture('Chat Navigation', { type: 'History' })
		commandService.executeCommand(VOID_CMD_SHIFT_L_ACTION_ID)

	}
})


// Settings gear
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'void.settingsAction',
			title: 'Code Settings',
			icon: { id: 'settings-gear' },
			menu: [{ id: MenuId.ViewTitle, group: 'navigation', when: ContextKeyExpr.equals('view', CODE_VIEW_ID), }]
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const commandService = accessor.get(ICommandService)
		commandService.executeCommand(CODE_TOGGLE_SETTINGS_ACTION_ID)
	}
})




// export class TabSwitchListener extends Disposable {

// 	constructor(
// 		onSwitchTab: () => void,
// 		@ICodeEditorService private readonly _editorService: ICodeEditorService,
// 	) {
// 		super()

// 		// when editor switches tabs (models)
// 		const addTabSwitchListeners = (editor: ICodeEditor) => {
// 			this._register(editor.onDidChangeModel(e => {
// 				if (e.newModelUrl?.scheme !== 'file') return
// 				onSwitchTab()
// 			}))
// 		}

// 		const initializeEditor = (editor: ICodeEditor) => {
// 			addTabSwitchListeners(editor)
// 		}

		// initialize current editors + any new editors
		for (let editor of this._editorService.listCodeEditors()) initializeEditor(editor)
		this._register(this._editorService.onCodeEditorAdd(editor => { initializeEditor(editor) }))
	}
}


class TabSwitchContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.void.tabswitch'

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IViewsService private readonly viewsService: IViewsService,
		@ICodeUriStateService private readonly uriStateService: ICodeUriStateService,
		@ICodeEditorService private readonly codeEditorService: ICodeEditorService,
		// @ICommandService private readonly commandService: ICommandService,
	) {
		super()

		// sidebarIsVisible state
		let sidebarIsVisible = this.viewsService.isViewContainerVisible(CODE_VIEW_CONTAINER_ID)
		this._register(this.viewsService.onDidChangeViewVisibility(e => {
			sidebarIsVisible = e.visible
		}))

		const onSwitchTab = () => { // update state
			if (sidebarIsVisible) {
				const currentUri = this.codeEditorService.getActiveCodeEditor()?.getModel()?.uri
				if (!currentUri) return;
				this.uriStateService.setState({ currentUri })
				// this.commandService.executeCommand(CODE_ADD_SELECTION_TO_SIDEBAR_ACTION_ID)
			}
		}

		// when sidebar becomes visible, add current file
		this._register(this.viewsService.onDidChangeViewVisibility(e => { sidebarIsVisible = e.visible }))

		// run on current tab if it exists, and listen for tab switches and visibility changes
		onSwitchTab()
		this._register(this.viewsService.onDidChangeViewVisibility(() => { onSwitchTab() }))
		this._register(this.instantiationService.createInstance(TabSwitchListener, () => { onSwitchTab() }))
	}
}

registerWorkbenchContribution2(TabSwitchContribution.ID, TabSwitchContribution, WorkbenchPhase.BlockRestore);
