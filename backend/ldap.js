import LdapClient from 'ldapjs-client';
import timer from 'node-schedule';
import { EventEmitter } from 'events';

import { User } from './models.js';

export default class Ldap extends EventEmitter {
    constructor(config) {
        super();
        this.test = config.test || false;
        this.url = config.url;
        this.timeout = config.timeout;
        this.username = config.username;
        this.password = config.password;
        this.userDn = config.userDn;
        this.updateCron = config.updateCron || "0 * * * * *";

        if (this.test) {
            console.log('Running in test mode, no LDAP connection will be opened.');
            this.client = null;
            this.users = [
                new User({
                    id: '3e8fe04c-5307-4190-8b42-285669f785b9',
                    uid: 'eliot.alderson',
                    name: 'Eliot',
                    surname: 'Alderson',
                    printableName: 'Eliot Alderson',
                    accountLocked: false,
                    email: 'eliot.alderson@ecorp.com',
                    groups: ['chat','software','soviet'],
                    hasKey: true,
                }),
                new User({
                    id: 'f7639634-fd4e-4953-a15b-cddd091ae7d2',
                    uid: 'darlene.alderson',
                    name: 'Darlene',
                    surname: 'Alderson',
                    printableName: 'Darlene Alderson',
                    accountLocked: false,
                    email: 'darlene.alderson@fsociety.com',
                    groups: ['chat','software'],
                    hasKey: false,
                }),
                new User({
                    id: '7691d893-4c17-4805-a8d9-8dfb484f7cfe',
                    uid: 'tyrell.wellick',
                    name: 'Tyrell',
                    surname: 'Wellick',
                    printableName: 'Tyrell Wellick',
                    accountLocked: false,
                    email: 'tyrell.wellick',
                    groups: ['chat','repairer'],
                    hasKey: false,
                }),
            ];
            return;
        }
        console.log(`Connecting to LDAP server at ${this.url}...`);
        this.client = new LdapClient({ url: this.url, timeout: this.timeout });
        this.users = [];
    }

    async connect() {
        if (this.test) {
            this.emit('usersUpdate', this.users);
            return;
        }
        await this.client.bind(this.username, this.password);
        this.updateUsersCache().then(() => {
            this.refreshTimer = timer.scheduleJob(this.updateCron, this.updateUsersCache.bind(this));
        });
    }

    async updateUsersCache() {
        if (this.test) {
            this.emit('usersUpdate', this.users);
            return;
        }
        let res = await this.client.search(this.userDn, {
            scope: 'sub',
            filter: '(uid=*)',
            attributes: ['weeeopenuniqueid','uid','cn','givenname','sn','nsaccountlock','memberof','haskey','mail'],
        });
        this.users = res.map(user => {
            let groups = user.memberof || [];
            if (!Array.isArray(groups)) { // if there's only one group, it's a string
                groups = [groups];
            }
            groups = Array.from(groups).map(group => {
                let entries = group.split(',');
                let cn = entries.find(entry => entry.startsWith('cn='));
                let groupName = cn.split('=')[1];
                return groupName;
            });
            return new User({
                id: user.weeeopenuniqueid,
                username: user.uid,
                name: user.givenname,
                surname: user.sn,
                printableName: user.cn,
                accountLocked: user.nsaccountlock == 'true',
                email: user.mail,
                groups,
                hasKey: user.haskey == 'true',
            })
        });
        this.emit('usersUpdate', this.users);
    }

    async getAllUsers() {
        return this.users;
    }

    async getUser(uid) {
        return this.users.find(user => user.uid === uid);
    }
}
