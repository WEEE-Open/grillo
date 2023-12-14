class LdapUserManager {

    constructor(config) {
        this.url = config.ladpUrl;
        this.ldap;
    }

    connect(){
        console.log('connected!');
    }

    getUser(uid){
        try{
            ldap.get(uid);
            return new LdapUser('uid', 'Mario', 'Rossi', ['KEY'], 's300000', 'a');
        }
        catch(error){
            console.error(error);
        }
    }

}

class LdapUser{
    constructor(uid, username, name, surname, groups, studentId, labName){
        this.uid = uid;
        this.username = username;
        this.name = name; 
        this.surname = surname;
        this.groups = groups;
        this.studentId = studentId;
        this.labName = labName;
    }

}

export class User{
    constructor(id, minutes, inlab, lastUpdate, lastMinutes, hasKey){
        this.id = id;
        this.minutes = minutes;
        this.inlab = inlab;
        this.lastUpdate = lastUpdate;
        this.lastMinutes = lastMinutes;
        this.hasKey = hasKey;
    }

}

export class Booking{
    constructor(userId, time, hasKey){
        this.userId = userId;
        this.time = time;
        this.hasKey = hasKey;
    }
}