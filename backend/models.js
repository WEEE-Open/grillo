export class User{
    constructor(opt){
        this.id = opt.id;
        this.username = opt.username;
        this.name = opt.name;
        this.surname = opt.surname;
        this.printableName = opt.printableName;
        this.seconds = opt.seconds;
        this.inlab = opt.inlab;
        this.hasKey = opt.hasKey;
        this.groups = opt.groups;
    }

    get isAdmin(){
        if (this.groups === undefined){
            return false;
        }
        return this.groups.includes('soviet');
    }
}

export class Booking{
    constructor(userId, time, hasKey){
        this.userId = userId;
        this.time = time;
        this.hasKey = hasKey;
    }
}