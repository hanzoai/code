/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import Severity from '../../../../base/common/severity.js';
import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';
import { localize2 } from '../../../../nls.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IMetricsService } from '../../../../platform/void/common/metricsService.js';
import { ICodeUpdateService } from '../../../../platform/void/common/codeUpdateService.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import * as dom from '../../../../base/browser/dom.js';
import { IUpdateService } from '../../../../platform/update/common/update.js';
import { VoidCheckUpdateRespose } from '../common/voidUpdateServiceTypes.js';
import { IAction } from '../../../../base/common/actions.js';




const notifyYesUpdate = (notifService: INotificationService, msg?: string) => {
	const message = msg || 'This is a very old version of void, please download the latest version! [Code Editor](https://code.hanzo.ai/download-beta)!'
	notifService.notify({
		severity: Severity.Info,
		message: message,
		sticky: true,
		progress: actions ? { worked: 0, total: 100 } : undefined,
		actions: actions,
	})

	return notifController
	// const d = notifController.onDidClose(() => {
	// 	notifyYesUpdate(notifService, res)
	// 	d.dispose()
	// })
}
const notifyNoUpdate = (notifService: INotificationService) => {
	notifService.notify({
		severity: Severity.Info,
		message: 'Code is up-to-date!',
	})
}
const notifyErrChecking = (notifService: INotificationService) => {
	const message = `Code Error: There was an error checking for updates. If this persists, please get in touch or reinstall Code [here](https://code.hanzo.ai/download-beta)!`
	notifService.notify({
		severity: Severity.Info,
		message: message,
		sticky: true,
	})
	return notifController
}


const performVoidCheck = async (
	explicit: boolean,
	notifService: INotificationService,
	voidUpdateService: IVoidUpdateService,
	metricsService: IMetricsService,
	updateService: IUpdateService,
): Promise<INotificationHandle | null> => {

	const metricsTag = explicit ? 'Manual' : 'Auto'

	metricsService.capture(`Void Update ${metricsTag}: Checking...`, {})
	const res = await voidUpdateService.check(explicit)
	if (!res) {
		const notifController = notifyErrChecking(notifService);
		metricsService.capture(`Void Update ${metricsTag}: Error`, { res })
		return notifController
	}
	else {
		if (res.message) {
			const notifController = notifyUpdate(res, notifService, updateService)
			metricsService.capture(`Void Update ${metricsTag}: Yes`, { res })
			return notifController
		}
		else {
			metricsService.capture(`Void Update ${metricsTag}: No`, { res })
			return null
		}
	}
}


// Action
let lastNotifController: INotificationHandle | null = null


registerAction2(class extends Action2 {
	constructor() {
		super({
			f1: true,
			id: 'void.codeCheckUpdate',
			title: localize2('codeCheckUpdate', 'Code: Check for Updates'),
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const codeUpdateService = accessor.get(ICodeUpdateService)
		const notifService = accessor.get(INotificationService)
		const metricsService = accessor.get(IMetricsService)
		const updateService = accessor.get(IUpdateService)

		metricsService.capture('Code Update Manual: Checking...', {})
		const res = await codeUpdateService.check()
		if (!res) { notifyErrChecking(notifService); metricsService.capture('Code Update Manual: Error', { res }) }
		else if (res.hasUpdate) { notifyYesUpdate(notifService, res.message); metricsService.capture('Code Update Manual: Yes', { res }) }
		else if (!res.hasUpdate) { notifyNoUpdate(notifService); metricsService.capture('Code Update Manual: No', { res }) }
	}
})

// on mount
class CodeUpdateWorkbenchContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.void.codeUpdate'
	constructor(
		@ICodeUpdateService private readonly codeUpdateService: ICodeUpdateService,
		@IMetricsService private readonly metricsService: IMetricsService,
		@INotificationService private readonly notifService: INotificationService,
	) {
		super()
		const autoCheck = async () => {
			this.metricsService.capture('Code Update Startup: Checking...', {})
			const res = await this.codeUpdateService.check()
			if (!res) { notifyErrChecking(this.notifService); this.metricsService.capture('Code Update Startup: Error', { res }) }
			else if (res.hasUpdate) { notifyYesUpdate(this.notifService, res.message); this.metricsService.capture('Code Update Startup: Yes', { res }) }
			else if (!res.hasUpdate) { this.metricsService.capture('Code Update Startup: No', { res }) } // display nothing if up to date
		}

		// check once 5 seconds after mount
		// check every 3 hours
		const { window } = dom.getActiveWindow()

		const initId = window.setTimeout(() => autoCheck(), 5 * 1000)
		this._register({ dispose: () => window.clearTimeout(initId) })


		const intervalId = window.setInterval(() => autoCheck(), 3 * 60 * 60 * 1000) // every 3 hrs
		this._register({ dispose: () => window.clearInterval(intervalId) })

	}
}
registerWorkbenchContribution2(CodeUpdateWorkbenchContribution.ID, CodeUpdateWorkbenchContribution, WorkbenchPhase.BlockRestore);
