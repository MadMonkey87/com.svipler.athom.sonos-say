'use strict';

const Homey = require('homey');
const sonos_api = require('./node-sonos-http-api-master/sonos_api');
const fs = require('fs');
const path = require('path');

class SonosSay extends Homey.App {

	onInit() {
		this.log('SonosSay is running...');
		this.initializeActions();

		this.log('Listing local files');
		try {
			this.readFiles('/userdata/');
		} catch (err) {
			this.log('Listing local files failed', error);
		}
	}

	readFiles(folder) {
		fs.readdir(folder, (err, fileNames) => {
			if (fileNames) {
				fileNames.forEach(fileName => {
					let fileStats = fs.statSync(folder + fileName);
					if (fileStats.isFile()) {
						this.log(folder + fileName + '(' + fileStats.size + ' bytes)');
					} else if (fileStats.isDirectory()) {
						this.log(folder + fileName + '(dir)');
						this.readFiles(folder + fileName + '/');
					}
				});
			}
		});
	}

	initializeActions() {

		var actionsCards = {};
		for (let actionCardIndex = 0; actionCardIndex < this.manifest.flow.actions.length; actionCardIndex++) {
			const actionCard = this.manifest.flow.actions[actionCardIndex];
			var card = this.homey.flow.getActionCard(actionCard.id);
			actionsCards[actionCard.id] = card;

			if (actionCard.args) {

				if (actionCard.args.find(x => x.name == 'speaker' && x.type == 'autocomplete')) card.getArgument('speaker').registerAutocompleteListener((query, args) => {
					return new Promise((resolve, reject) => {
						this.getSpeakersList((error, speakers) => {
							if (error) {
								reject(error);
								return;
							}
							let result = [];

							if (['action_sonos_say', 'action_sonos_say_url', 'action_sonos_play_clip'].indexOf(actionCard.id) > -1) result.push({ name: 'All Speakers', id: '-' });
							if (speakers.status == "error") {
								result.push({ name: "Something went wrong, please try again!", id: "NA" });
							} else {
								if (speakers) speakers.forEach(entry => {
									const name = entry.coordinator.roomName;
									if (!query || name.toLowerCase().includes(query.toLowerCase())) {
										result.push({ name: name, id: name });
									}
								});
							}
							result.sort((i, j) => ('' + i.name).localeCompare(j.name));
							resolve(result);
						})
					});
				});

				if (actionCard.args.find(x => x.name == 'clip' && x.type == 'autocomplete')) card.getArgument('clip').registerAutocompleteListener((query, args) => {
					return new Promise((resolve, reject) => {
						try {
							const folder = '/userdata/static/clips';
							fs.readdir(folder, (err, fileNames) => {
								let result = [];
								if (fileNames) {
									fileNames.forEach(fileName => {
										let fileStats = fs.statSync(folder + '/' + fileName);
										if (fileStats.isFile() && (!query || fileName.toLowerCase().includes(query.toLowerCase()))) {
											result.push({ name: fileName });
										}
									});
								}
								result.sort((i, j) => ('' + i.name).localeCompare(j.name));
								resolve(result);
							});
						} catch (err) {
							reject(err);
						}
					});
				});
			}
		}

		actionsCards['action_sonos_lock_volume'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.lockVolume((error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				})
			});
		});

		actionsCards['action_sonos_unlock_volume'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.unlockVolume((error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				})
			});
		});

		actionsCards['action_sonos_toggle_mute'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.toggleMute(args.speaker.id, (error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				})
			});
		});

		actionsCards['action_sonos_set_sleepmode'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.setSleepMode(args.speaker.id, args.timeout, (error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				})
			});
		});

		actionsCards['action_sonos_set_repeat_mode'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.setRepeatMode(args.speaker.id, args.repeatmode, (error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				})
			});
		});

		actionsCards['action_sonos_enable_shuffle'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.enableShuffle(args.speaker.id, (error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				})
			});
		});

		actionsCards['action_sonos_disable_shuffle'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.disableShuffle(args.speaker.id, (error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				})
			});
		});

		actionsCards['action_sonos_enable_crossfade'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.enableCrossfade(args.speaker.id, (error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				})
			});
		});

		actionsCards['action_sonos_disable_crossfade'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.disableCrossfade(args.speaker.id, (error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				})
			});
		});

		actionsCards['action_sonos_say'].registerRunListener((args, state) => {
			if (args.speaker.id === '-') {
				return new Promise((resolve, reject) => {
					this.sayAll(args.text, args.volume, args.language, (error, result) => {
						if (error) { reject(error); } else {
							resolve(true);
						}
					})
				});
			} else {
				return new Promise((resolve, reject) => {
					this.say(args.speaker.id, args.text, args.volume, args.language, (error, result) => {
						if (error) { reject(error); } else {
							resolve(true);
						}
					})
				});
			}
		});

		actionsCards['action_sonos_say_url'].registerRunListener((args, state) => {
			if (args.speaker.id === '-') {
				return new Promise((resolve, reject) => {
					this.sayAllUrl(args.url, args.volume, args.durationAudio, (error, result) => {
						if (error) { reject(error); } else {
							resolve(true);
						}
					})
				});
			} else {
				return new Promise((resolve, reject) => {
					this.sayUrl(args.speaker.id, args.url, args.volume, args.durationAudio, (error, result) => {
						if (error) { reject(error); } else {
							resolve(true);
						}
					})
				});
			}
		});

		actionsCards['action_sonos_clear_queue'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.clearQueue(args.speaker.id, (error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				});
			});
		});

		actionsCards['action_clear_cache'].registerRunListener((args, state) => {
			return new Promise((resolve, reject) => {
				this.clearCache((error, result) => {
					if (error) { reject(error); } else {
						resolve(true);
					}
				});
			});
		});

		actionsCards['action_sonos_play_clip'].registerRunListener((args, state) => {
			if (args.speaker.id === '-') {
				return new Promise((resolve, reject) => {
					this.playClipAll(args.clip.name, args.volume, (error, result) => {
						if (error) { reject(error); } else {
							resolve(true);
						}
					})
				});
			} else {
				return new Promise((resolve, reject) => {
					this.playClip(args.speaker.id, args.clip.name, args.volume, (error, result) => {
						if (error) { reject(error); } else {
							resolve(true);
						}
					})
				});
			}
		});

		actionsCards['action_sonos_play_random_clip'].registerRunListener((args, state) => {
			let clips = this.getClips();
			let clip = clips[Math.floor(Math.random() * clips.length)].name;
			if (args.speaker.id === '-') {
				return new Promise((resolve, reject) => {
					this.playClipAll(clip, args.volume, (error, result) => {
						if (error) { reject(error); } else {
							resolve(true);
						}
					})
				});
			} else {
				return new Promise((resolve, reject) => {
					this.playClip(args.speaker.id, clip, args.volume, (error, result) => {
						if (error) { reject(error); } else {
							resolve(true);
						}
					})
				});
			}
		});
	}

	getSpeakersList(callback) {
		sonos_api.fakeRequest('/zones', (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	say(roomName, text, volume, language, callback) {
		sonos_api.fakeRequest(`/${roomName}/say/${encodeURI(text)}/${language}/${volume}`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	sayUrl(roomName, url, volume, duration, callback) {
		sonos_api.fakeRequest(`/${roomName}/sayurl/${Buffer.from(url).toString('base64')}/${volume}/${duration}`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	sayAllUrl(url, volume, duration, callback) {
		sonos_api.fakeRequest(`/sayallurl/${Buffer.from(url).toString('base64')}/${volume}/${duration}`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	sayAll(text, volume, language, callback) {
		sonos_api.fakeRequest(`/sayall/${encodeURI(text)}/${language}/${volume}`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	clearQueue(roomName, callback) {
		sonos_api.fakeRequest(`/${roomName}/clearqueue/`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	lockVolume(callback) {
		sonos_api.fakeRequest(`/lockvolumes`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	unlockVolume(callback) {
		sonos_api.fakeRequest(`/unlockvolumes`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	toggleMute(roomName, callback) {
		sonos_api.fakeRequest(`/${roomName}/togglemute`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	setSleepMode(roomName, duration, callback) {
		if (duration <= 0) {
			duration = 'off';
		}
		sonos_api.fakeRequest(`/${roomName}/sleep/${duration}`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	setRepeatMode(roomName, repeatMode, callback) {
		sonos_api.fakeRequest(`/${roomName}/repeat/${repeatMode}`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	enableShuffle(roomName, callback) {
		sonos_api.fakeRequest(`/${roomName}/shuffle/on`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	disableShuffle(roomName, callback) {
		sonos_api.fakeRequest(`/${roomName}/shuffle/off`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	enableCrossfade(roomName, callback) {
		sonos_api.fakeRequest(`/${roomName}/crossfade/on`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	disableCrossfade(roomName, callback) {
		sonos_api.fakeRequest(`/${roomName}/crossfade/off`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	playClip(roomName, filename, volume, callback) {
		sonos_api.fakeRequest(`/${roomName}/clip/${filename}/${volume}`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	playClipAll(filename, volume, callback) {
		sonos_api.fakeRequest(`/clipall/${filename}/${volume}`, (error, response) => {
			callback(error, !!error ? null : response)
		})
	}

	getCache() {
		let result = [];
		const folder = '/userdata/static/tts/';
		try {
			const fileNames = fs.readdirSync(folder);
			if (fileNames) {
				fileNames.forEach(fileName => {
					let fileStats = fs.statSync(folder + '/' + fileName);
					if (fileStats.isFile()) {
						result.push({ name: fileName, size: fileStats.size });
					}
				});
			}
			result = result.sort((i, j) => ('' + i.name).localeCompare(j.name));
		} catch (err) {
			this.log(err);
		}
		return result;
	}

	getCacheItem(name) {
		const folder = '/userdata/static/tts/';
		let content = fs.readFileSync(folder + '/' + name, { encoding: 'base64' });
		return { name: name, type: 'audio/mpeg', content: content }
	}

	clearCache(callback) {

		const directory = '/userdata/static/tts/';

		fs.readdir(directory, (err, files) => {
			if (err) {
				callback(err, null);
				return;
			}

			for (const file of files) {
				fs.unlink(path.join(directory, file), err => {
					if (err) {
						callback(err, null);
						return;
					}
				});
			}
		});

		this.log('Listing local files');
		try {
			this.readFiles('/userdata/');
		} catch (err) {
			this.log('Listing local files failed', error);
		}

		callback(null, {});
	}

	getClips() {
		let result = [];
		const folder = '/userdata/static/clips';
		try {
			const fileNames = fs.readdirSync(folder);
			if (fileNames) {
				fileNames.forEach(fileName => {
					let fileStats = fs.statSync(folder + '/' + fileName);
					if (fileStats.isFile()) {
						result.push({ name: fileName, size: fileStats.size });
					}
				});
			}
			result = result.sort((i, j) => ('' + i.name).localeCompare(j.name));
		} catch (err) {
			this.log(err);
		}
		return result;
	}

	getClip(name) {
		const folder = '/userdata/static/clips';
		let content = fs.readFileSync(folder + '/' + name, { encoding: 'base64' });
		return { name: name, type: 'audio/mpeg', content: content }
	}

	removeClip(name) {
		const folder = '/userdata/static/clips';
		fs.unlinkSync(folder + '/' + name);
	}

	addClip(body, callback) {
		try {
			const foldername = '/userdata/static/clips';
			if (!fs.existsSync(foldername)) {
				this.log('create folder', foldername);
				fs.mkdirSync(foldername);
			}

			const buffer = Buffer.from(body.content.split(',')[1], 'base64');
			const filename = foldername + '/' + body.name;

			this.log('attempt to write file', filename);
			if (fs.existsSync(filename)) {
				callback('the file exists already', null);
			} else {
				fs.writeFile(filename, buffer, () => {
					this.log('wrote content to file', filename);
					callback(null, { foo: 'bar' });
				});
			}
		} catch (err) {
			this.log('error writing file', err);
			callback(err, null);
		}
	}
}

module.exports = SonosSay;