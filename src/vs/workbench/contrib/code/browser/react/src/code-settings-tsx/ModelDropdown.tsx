/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FeatureName, featureNames, ModelSelection, modelSelectionsEqual, ProviderName, providerNames } from '../../../../../../../platform/void/common/codeSettingsTypes.js'
import { useSettingsState, useRefreshModelState, useAccessor } from '../util/services.js'
import { _CodeSelectBox, CodeCustomSelectBox } from '../util/inputs.js'
import { SelectBox } from '../../../../../../../base/browser/ui/selectBox/selectBox.js'
import { IconWarning } from '../sidebar-tsx/SidebarChat.js'
import { CODE_OPEN_SETTINGS_ACTION_ID, CODE_TOGGLE_SETTINGS_ACTION_ID } from '../../../codeSettingsPane.js'
import { ModelOption } from '../../../../../../../platform/void/common/codeSettingsService.js'



const optionsEqual = (m1: ModelOption[], m2: ModelOption[]) => {
	if (m1.length !== m2.length) return false
	for (let i = 0; i < m1.length; i++) {
		if (!modelSelectionsEqual(m1[i].selection, m2[i].selection)) return false
	}
	return true
}

const ModelSelectBox = ({ options, featureName, className }: { options: ModelOption[], featureName: FeatureName, className: string }) => {
	const accessor = useAccessor()
	const codeSettingsService = accessor.get('ICodeSettingsService')

	const selection = codeSettingsService.state.modelSelectionOfFeature[featureName]
	const selectedOption = selection ? codeSettingsService.state._modelOptions.find(v => modelSelectionsEqual(v.selection, selection)) : options[0]

	const onChangeOption = useCallback((newOption: ModelOption) => {
		codeSettingsService.setModelSelectionOfFeature(featureName, newOption.selection)
	}, [codeSettingsService, featureName])

	return <CodeCustomSelectBox
		options={options}
		selectedOption={selectedOption}
		onChangeOption={onChangeOption}
		getOptionDisplayName={(option) => option.selection.modelName}
		getOptionDropdownName={(option) => option.selection.modelName}
		getOptionDropdownDetail={(option) => option.selection.providerName}
		getOptionsEqual={(a, b) => optionsEqual([a], [b])}
		className={`text-xs text-code-fg-3 px-1`}
		matchInputWidth={false}
	/>
}

// 	const codeSettingsService = accessor.get('ICodeSettingsService')

// 	let weChangedText = false

// 	return <CodeSelectBox
// 		className='@@[&_select]:!code-text-xs text-code-fg-3'
// 		options={options}
// 		onChangeSelection={useCallback((newVal: ModelSelection) => {
// 			if (weChangedText) return
// 			codeSettingsService.setModelSelectionOfFeature(featureName, newVal)
// 		}, [codeSettingsService, featureName])}
// 		// we are responsible for setting the initial state here. always sync instance when state changes.
// 		onCreateInstance={useCallback((instance: SelectBox) => {
// 			const syncInstance = () => {
// 				const modelsListRef = codeSettingsService.state._modelOptions // as a ref
// 				const settingsAtProvider = codeSettingsService.state.modelSelectionOfFeature[featureName]
// 				const selectionIdx = settingsAtProvider === null ? -1 : modelsListRef.findIndex(v => modelSelectionsEqual(v.value, settingsAtProvider))
// 				weChangedText = true
// 				instance.select(selectionIdx === -1 ? 0 : selectionIdx)
// 				weChangedText = false
// 			}
// 			syncInstance()
// 			const disposable = codeSettingsService.onDidChangeState(syncInstance)
// 			return [disposable]
// 		}, [codeSettingsService, featureName])}
// 	/>
// }

const MemoizedModelSelectBox = ({ featureName }: { featureName: FeatureName }) => {
	const settingsState = useSettingsState()
	const oldOptionsRef = useRef<ModelOption[]>([])
	const [memoizedOptions, setMemoizedOptions] = useState(oldOptionsRef.current)

	const { filter, emptyMessage } = modelFilterOfFeatureName[featureName]

	useEffect(() => {
		const oldOptions = oldOptionsRef.current
		const newOptions = settingsState._modelOptions.filter((o) => filter(o.selection, { chatMode: settingsState.globalSettings.chatMode, overridesOfModel: settingsState.overridesOfModel }))

		if (!optionsEqual(oldOptions, newOptions)) {
			setMemoizedOptions(newOptions)
		}
		oldOptionsRef.current = newOptions
	}, [settingsState._modelOptions, filter])

	if (memoizedOptions.length === 0) { // Pretty sure this will never be reached unless filter is enabled
		return <WarningBox text={emptyMessage?.message || 'No models available'} />
	}

	return <ModelSelectBox featureName={featureName} options={memoizedOptions} className={className} />

}

export const WarningBox = ({ text, onClick, className }: { text: string; onClick?: () => void; className?: string }) => {

	return <div
		className={`
			text-code-warning brightness-90 opacity-90
			text-xs text-ellipsis
			${onClick ? `hover:brightness-75 transition-all duration-200 cursor-pointer` : ''}
			flex items-center flex-nowrap
			${className}
		`}
		onClick={onClick}
	>
		<IconWarning
			size={14}
			className='mr-1'
		/>
		<span>{text}</span>
	</div>
	// return <CodeSelectBox
	// 	options={[{ text: 'Please add a model!', value: null }]}
	// 	onChangeSelection={() => { }}
	// />
}

export const ModelDropdown = ({ featureName }: { featureName: FeatureName }) => {
	const settingsState = useSettingsState()

	const accessor = useAccessor()
	const commandService = accessor.get('ICommandService')

	const openSettings = () => { commandService.executeCommand(CODE_OPEN_SETTINGS_ACTION_ID); };


	const { emptyMessage } = modelFilterOfFeatureName[featureName]

	const isDisabled = isFeatureNameDisabled(featureName, settingsState)
	if (isDisabled)
		return <WarningBox onClick={openSettings} text={
			emptyMessage && emptyMessage.priority === 'always' ? emptyMessage.message :
				isDisabled === 'needToEnableModel' ? 'Enable a model'
					: isDisabled === 'addModel' ? 'Add a model'
						: (isDisabled === 'addProvider' || isDisabled === 'notFilledIn' || isDisabled === 'providerNotAutoDetected') ? 'Provider required'
							: 'Provider required'
		} />

	return <ErrorBoundary>
		<MemoizedModelDropdown featureName={featureName} className={className} />
	</ErrorBoundary>
}
