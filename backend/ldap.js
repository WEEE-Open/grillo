import LdapClient from 'ldapjs-client';
import timer from 'node-schedule';

import { User } from './models.js';

export default class Ldap {
    constructor(config) {
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
                    id: 'eliot.alderson',
                    name: 'Eliot',
                    surname: 'Alderson',
                    printableName: 'Eliot Alderson',
                    accountLocked: false,
                    email: 'eliot.alderson@ecorp.com',
                    groups: ['chat','software','soviet'],
                    hasKey: true,
                }),
                new User({
                    id: 'darlene.alderson',
                    name: 'Darlene',
                    surname: 'Alderson',
                    printableName: 'Darlene Alderson',
                    accountLocked: false,
                    email: 'darlene.alderson@fsociety.com',
                    groups: ['chat','software'],
                    hasKey: false,
                }),
                new User({
                    id: 'tyrell.wellick',
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
        this.refreshTimer = timer.scheduleJob(this.updateCron, () => this.updateUsersCache());
    }

    async connect() {
        if (this.test) {
            return;
        }
        await this.client.bind(this.username, this.password);
    }

    async updateUsersCache() {
        if (this.test) {
            return;
        }
        let res = await this.client.search(this.userDn, {
            scope: 'sub',
            filter: '(uid=*)',
            attributes: ['uid','cn','givenname','sn','nsaccountlock','memberof','haskey','mail'],
        });
        console.log(JSON.stringify(res, null, 2));
        this.users = res.map(user => new User({
            id: user.uid,
            name: user.givenname,
            surname: user.sn,
            printableName: user.cn,
            accountLocked: user.nsaccountlock == 'true',
            email: user.mail,
            groups: user.memberof || [],
            hasKey: user.haskey == 'true',
        }));
    }

    async getAllUsers() {
        return this.users;
    }

    async getUser(uid) {
        return this.users.find(user => user.uid === uid);
    }
}
