import LdapClient from 'ldapjs-client';

export default class Ldap {
    constructor(config) {
        this.test = config.test;
        this.url = config.url;
        this.timeout = config.timeout;
        this.username = config.username;
        this.password = config.password;
        this.userDn = config.userDn;

        if (this.test) {
            this.client = null;
            this.users = [
                // TODO add demo data
            ];
            return;
        }

        this.client = new LdapClient({ url: this.url, timeout: this.timeout });
        this.users = [];
    }

    async connect() {
        if (this.test) {
            return;
        }
        await this.client.bind(this.username, this.password);
    }

    async getAllUsers() {
        if (this.test) {
            return this.users;
        }
        return await this.client.search(this.userDn, {
            scope: 'sub',
            filter: '(uid=*)',
            attributes: [] // TODO reduce to only the needed attributes
        });
    }
}

export class User {
    constructor(uid, name, surname, email) {
        this.uid = uid;
        this.name = name;
        this.surname = surname;
        this.email = email;
    }
}
