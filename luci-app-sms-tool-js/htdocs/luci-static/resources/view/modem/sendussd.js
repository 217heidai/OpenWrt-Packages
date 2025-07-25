'use strict';
'require dom';
'require form';
'require fs';
'require ui';
'require uci';
'require view';

/*
	Copyright 2022-2025 Rafał Wabik - IceG - From eko.one.pl forum

	Licensed to the GNU General Public License v3.0.
*/

return view.extend({
	handleCommand: function(exec, args) {
		let buttons = document.querySelectorAll('.cbi-button');

		for (let i = 0; i < buttons.length; i++)
			buttons[i].setAttribute('disabled', 'true');

		return fs.exec(exec, args).then(function(res) {
			let out = document.querySelector('.ussdcommand-output');
			let fullhistory = document.getElementById('history-full')?.checked;
			let reversereplies = document.getElementById('reverse-replies')?.checked;
			out.style.display = '';

			res.stdout = res.stdout?.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "") || '';
			res.stderr = res.stderr?.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "") || '';

			if (res.stdout === undefined || res.stderr === undefined || res.stderr.includes('undefined') || res.stdout.includes('undefined')) {
				return;
			} else {
				let cut = res.stderr;
				if ( cut.length > 2 ) {
					if (cut.includes('error: 0'))
						res.stdout = _('Phone/Modem failure.');
					if (cut.includes('error: 1'))
						res.stdout = _('No connection to phone.');
					if (cut.includes('error: 2'))
						res.stdout = _('Phone/Modem adapter link reserved.');
					if (cut.includes('error: 3'))
						res.stdout = _('Operation not allowed.');
					if (cut.includes('error: 4'))
						res.stdout = _('Operation not supported.');
					if (cut.includes('error: 5'))
						res.stdout = _('PH_SIM PIN required.');
					if (cut.includes('error: 6'))
						res.stdout = _('PH_FSIM PIN required.');
					if (cut.includes('error: 7'))
						res.stdout = _('PH_FSIM PUK required.');
					if (cut.includes('error: 10'))
						res.stdout = _('SIM not inserted.');
					if (cut.includes('error: 11'))
						res.stdout = _('SIM PIN required.');
					if (cut.includes('error: 12'))
						res.stdout = _('SIM PUK required.');
					if (cut.includes('error: 13'))
						res.stdout = _('SIM failure.');
					if (cut.includes('error: 14'))
						res.stdout = _('SIM busy.');
					if (cut.includes('error: 15'))
						res.stdout = _('SIM wrong.');
					if (cut.includes('error: 16'))
						res.stdout = _('Incorrect password.');
					if (cut.includes('error: 17'))
						res.stdout = _('SIM PIN2 required.');
					if (cut.includes('error: 18'))
						res.stdout = _('SIM PUK2 required.');
					if (cut.includes('error: 20'))
						res.stdout = _('Memory full.');
					if (cut.includes('error: 21'))
						res.stdout = _('Invalid index.');
					if (cut.includes('error: 22'))
						res.stdout = _('Not found.');
					if (cut.includes('error: 23'))
						res.stdout = _('Memory failure.');
					if (cut.includes('error: 24'))
						res.stdout = _('Text string too long.');
					if (cut.includes('error: 25'))
						res.stdout = _('Invalid characters in text string.');
					if (cut.includes('error: 26'))
						res.stdout = _('Dial string too long.');
					if (cut.includes('error: 27'))
						res.stdout = _('Invalid characters in dial string.');
					if (cut.includes('error: 30'))
						res.stdout = _('No network service.');
					if (cut.includes('error: 31'))
						res.stdout = _('Network timeout.');
					if (cut.includes('error: 32'))
						res.stdout = _('Network not allowed, emergency calls only.');
					if (cut.includes('error: 40'))
						res.stdout = _('Network personalization PIN required.');
					if (cut.includes('error: 41'))
						res.stdout = _('Network personalization PUK required.');
					if (cut.includes('error: 42'))
						res.stdout = _('Network subset personalization PIN required.');
					if (cut.includes('error: 43'))
						res.stdout = _('Network subset personalization PUK required.');
					if (cut.includes('error: 44'))
						res.stdout = _('Service provider personalization PIN required.');
					if (cut.includes('error: 45'))
						res.stdout = _('Service provider personalization PUK required.');
					if (cut.includes('error: 46'))
						res.stdout = _('Corporate personalization PIN required.');
					if (cut.includes('error: 47'))
						res.stdout = _('Corporate personalization PUK required.');
					if (cut.includes('error: 48'))
						res.stdout = _('PH-SIM PUK required.');
					if (cut.includes('error: 100'))
						res.stdout = _('Unknown error.');
					if (cut.includes('error: 103'))
						res.stdout = _('Illegal MS.');
					if (cut.includes('error: 106'))
						res.stdout = _('Illegal ME.');
					if (cut.includes('error: 107'))
						res.stdout = _('GPRS services not allowed.');
					if (cut.includes('error: 111'))
						res.stdout = _('PLMN not allowed.');
					if (cut.includes('error: 112'))
						res.stdout = _('Location area not allowed.');
					if (cut.includes('error: 113'))
						res.stdout = _('Roaming not allowed in this location area.');
					if (cut.includes('error: 126'))
						res.stdout = _('Operation temporary not allowed.');
					if (cut.includes('error: 132'))
						res.stdout = _('Service operation not supported.');
					if (cut.includes('error: 133'))
						res.stdout = _('Requested service option not subscribed.');
					if (cut.includes('error: 134'))
						res.stdout = _('Service option temporary out of order.');
					if (cut.includes('error: 148'))
						res.stdout = _('Unspecified GPRS error.');
					if (cut.includes('error: 149'))
						res.stdout = _('PDP authentication failure.');
					if (cut.includes('error: 150'))
						res.stdout = _('Invalid mobile class.');
					if (cut.includes('error: 256'))
						res.stdout = _('Operation temporarily not allowed.');
					if (cut.includes('error: 257'))
						res.stdout = _('Call barred.');
					if (cut.includes('error: 258'))
						res.stdout = _('Phone/Modem is busy.');
					if (cut.includes('error: 259'))
						res.stdout = _('User abort.');
					if (cut.includes('error: 260'))
						res.stdout = _('Invalid dial string.');
					if (cut.includes('error: 261'))
						res.stdout = _('SS not executed.');
					if (cut.includes('error: 262'))
						res.stdout = _('SIM Blocked.');
					if (cut.includes('error: 263'))
						res.stdout = _('Invalid block.');
					if (cut.includes('error: 527'))
						res.stdout = _('Please wait, and retry your selection later (Specific Modem Sierra).');
					if (cut.includes('error: 528'))
						res.stdout = _('Location update failure – emergency calls only (Specific Modem Sierra).');
					if (cut.includes('error: 529'))
						res.stdout = _('Selection failure – emergency calls only (Specific Modem Sierra).');
					if (cut.includes('error: 772'))
						res.stdout = _('SIM powered down.');
					    dom.content(out, [ res.stderr || '', res.stdout ? ' > ' + res.stdout : '' ]);
				    } else {
						if ( fullhistory ) {
    						    const ussdreply = (res.stdout + res.stderr).replace(/^\s*\n+/g, '');
							    let ussdv = document.getElementById('cmdvalue');
							    ussdv.value = '';
							    document.getElementById('cmdvalue').focus();
    							if (reversereplies) {
        							out.innerText = ussdreply + (out.innerText.trim() ? '\n\n' + out.innerText : '');
    							} else {
        							out.innerText += '\n\n' + res.stdout + res.stderr;
				            		out.innerText = out.innerText.replace(/^\s*\n+/g, '');
						        }
				        } else {
				            	dom.content(out, [ res.stdout || '', res.stderr || '' ]);
				        }
				    }
			}
		}).catch(function(err) {
			if (res.stdout === undefined || res.stderr === undefined || res.stderr.includes('undefined') || res.stdout.includes('undefined')) {
				return;
			} else {
				ui.addNotification(null, E('p', [ err ]));
			}
		}).finally(function() {
			for (let i = 0; i < buttons.length; i++)
				buttons[i].removeAttribute('disabled');
		});
	},

	handleGo: function(ev) {
		let ussd = document.getElementById('cmdvalue').value;
		let sections = uci.sections('sms_tool_js');
		let port = sections[0].ussdport;
		let get_ussd = sections[0].ussd;
		let get_pdu = sections[0].pdu;
		let get_coding = sections[0].coding;
		let tool_args = [];

		if ( ussd.length < 1 ) {
			ui.addNotification(null, E('p', _('Please specify the code to send')), 'info');
			return false;
		}

		if ( !port ) {
			ui.addNotification(null, E('p', _('Please set the port for communication with the modem')), 'info');
			return false;
		}

		tool_args.push('-d', port);
		if (get_ussd == '1')
			tool_args.push('-R');
		if (get_pdu == '1')
			tool_args.push('-r');
		if (get_coding && get_coding != 'auto')
			tool_args.push('-c', get_coding);
		tool_args.push('ussd', ussd);

		return this.handleCommand('sms_tool', tool_args);
	},

	handleClear: function(ev) {
		let out = document.querySelector('.ussdcommand-output');
		out.style.display = '';
		out.style.display = 'none';

		let fullhistory = document.getElementById('history-full')?.checked;

		if ( fullhistory ) {
		dom.content(out, [ '' ]);
		}

		let ov = document.getElementById('cmdvalue');
		ov.value = '';

		document.getElementById('cmdvalue').focus();
	},
	
	handleClearOut: function(ev) {
		let out = document.querySelector('.ussdcommand-output');
		let fullhistory = document.getElementById('history-full')?.checked;

		if ( fullhistory ) {
			out.style.display = '';
			out.style.display = 'none';
			dom.content(out, [ '' ]);
			document.getElementById("reverse-replies").disabled = false;
			document.getElementById("reverse-replies").checked = true;
		} else {
			document.getElementById("reverse-replies").disabled = true;
			document.getElementById("reverse-replies").checked = false;
		}
	},

	handleCopy: function(ev) {
		let out = document.querySelector('.ussdcommand-output');
		let fullhistory = document.getElementById('history-full')?.checked;

		if ( !fullhistory ) {
		out.style.display = 'none';
		}

		let ov = document.getElementById('cmdvalue');
		ov.value = '';
		let x = document.getElementById('tk').value;
		ov.value = x;
	},

	load: function() {

		return Promise.all([
			L.resolveDefault(fs.read_direct('/etc/modem/ussdcodes.user'), null),
			uci.load('sms_tool_js')
		]);
	},

	render: function (loadResults) {

	let info = _('User interface for sending USSD codes using sms-tool. More information about the sms-tool on the %seko.one.pl forum%s.').format('<a href="https://eko.one.pl/?p=openwrt-sms_tool" target="_blank">', '</a>');

		return E('div', { 'class': 'cbi-map', 'id': 'map' }, [
				E('h2', {}, [ _('USSD Codes') ]),
				E('div', { 'class': 'cbi-map-descr'}, info),
				E('hr'),
				E('div', { 'class': 'cbi-section' }, [
					E('div', { 'class': 'cbi-section-node' }, [
						E('div', { 'class': 'cbi-value' }, [
							E('label', { 'class': 'cbi-value-title' }, [ _('User USSD codes') ]),
							E('div', { 'class': 'cbi-value-field' }, [
									E('select', { 'class': 'cbi-input-select',
										'id': 'tk',
										'style': 'margin:5px 0; width:100%;',
										'change': ui.createHandlerFn(this, 'handleCopy'),
										'mousedown': ui.createHandlerFn(this, 'handleCopy')
									},
									(loadResults[0] || "").trim().split("\n").map(function(cmd) {
                                        let fields = cmd.split(/;/);
                                        let name = fields[0];
                                        let code = fields[1] || fields[0];
                                        return E('option', { 'value': code }, name );
                                    })
								)
							]) 
						]),
						E('div', { 'class': 'cbi-value' }, [
							E('label', { 'class': 'cbi-value-title' }, [ _('Code to send') ]),
							E('div', { 'class': 'cbi-value-field' }, [
							E('input', {
								'style': 'margin:5px 0; width:100%;',
								'type': 'text',
								'id': 'cmdvalue',
								'data-tooltip': _('Press [Enter] to send the code, press [Delete] to delete the code'),
								'keydown': function(ev) {
									if (ev.keyCode === 13) {
										let execBtn = document.getElementById('execute');
										if (execBtn) {
											execBtn.click();
											}
									}
									if (ev.keyCode === 46) {
										let del = document.getElementById('cmdvalue');
										if (del) {
											let ov = document.getElementById('cmdvalue');
											ov.value = '';
											document.getElementById('cmdvalue').focus();
										}
									}
								}
								}),
							])
						]),

					])
				]),
			E('div', { 'class': 'right' }, [
				E('label', { 'class': 'cbi-checkbox' }, [
					E('input', {
						'id': 'history-full',
						'click': ui.createHandlerFn(this, 'handleClearOut'),
						'data-tooltip': _('Check this option if you need to use the menu built on USSD codes'),
						'type': 'checkbox',
						'name': 'showhistory',
						'disabled': null
					}), ' ',
					E('label', { 'for': 'history-full' }), ' ',
					_('Keep the previous reply when sending a new USSD code.')
				]),
				'\xa0\xa0\xa0',
				E('label', { 'class': 'cbi-checkbox' }, [
					E('input', {
						'id': 'reverse-replies',
						'data-tooltip': _('View new reply from top'),
						'type': 'checkbox',
						'name': 'reversereplies',
						'disabled': true
					}), ' ',
					E('label', { 'for': 'reverse-replies' }), ' ',
					_('Turn over the replies.')
				])
			]),
				E('hr'),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'id': 'clr',
						'click': ui.createHandlerFn(this, 'handleClear')
					}, [ _('Clear form') ]),
					'\xa0\xa0\xa0',
					E('button', {
						'class': 'cbi-button cbi-button-action important',
						'id': 'execute',
						'click': ui.createHandlerFn(this, 'handleGo')
					}, [ _('Send code') ]),
				]),
				E('p', _('Reply')),
				E('pre', { 'class': 'ussdcommand-output', 'style': 'display:none; border: 1px solid var(--border-color-medium); border-radius: 5px; font-family: monospace' }),

			]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
})
