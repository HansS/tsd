/// <reference path="../_ref.ts" />
/// <reference path="../../xm/StyledOut.ts" />

module tsd {
	'use strict';

	export module cli {

		var path = require('path');
		var Q = require('q');

		var updateNotifier = require('update-notifier');

		// keep a global ref
		var notifier;

		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

		export function runUpdateNotifier(context:tsd.Context, promise:boolean = false):Q.Promise<any> {
			var opts = context.settings.getChild('update-notifier');

			return Q.resolve().then(() => {
				var defer = Q.defer();
				if (notifier || !opts.getBoolean('enabled', true)) {
					return Q.resolve(notifier);
				}
				// switch if we want to wait for this
				var callback = (promise ? (err, update) => {
					if (err) {
						notifier = null;
						defer.reject(err);
					}
					else {
						notifier.update = update;
						defer.resolve(notifier);
					}
				} : undefined);

				var settings:any = {
					packageName: context.packageInfo.name,
					packageVersion: context.packageInfo.version,
					updateCheckInterval: opts.getDurationSecs('updateCheckInterval', 24 * 3600) * 1000,
					updateCheckTimeout: opts.getDurationSecs('updateCheckTimeout', 10) * 1000,
					registryUrl: opts.getString('registryUrl'),
					callback: callback
				};

				notifier = updateNotifier(settings);
				if (!callback) {
					defer.resolve(notifier);
				}
				return defer.promise;
			});
		}

		export function showUpdateNotifier(output:xm.StyledOut, context?:tsd.Context, promise:boolean = false):Q.Promise<void> {
			return Q.resolve().then(() => {
				if (context) {
					return runUpdateNotifier(context, promise);
				}
				return notifier;
			}).then((notifier) => {
				if (notifier && notifier.update) {
					output.ln();
					output.report(true).span('update available: ');
					output.tweakPunc(notifier.update.current).accent(' -> ').tweakPunc(notifier.update.latest);
					output.ln().ln();
					output.indent().shell(true).span('npm update ' + notifier.update.name + ' -g');
					output.ln();

					notifier = null;
				}
			});
		}
	}
}
