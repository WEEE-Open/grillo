export class User{
    constructor(id, printableName, seconds, inlab, hasKey, groups){
        this.id = id;
        this.printableName = printableName;
        this.seconds = seconds;
        this.inlab = inlab;
        this.hasKey = hasKey;
        this.groups = groups;
    }

    get isAdmin(){
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