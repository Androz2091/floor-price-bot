import { Entity, Column, createConnection, Connection, PrimaryGeneratedColumn } from "typeorm";

export let connection: Connection;

export const initialize = async () => createConnection({
    type: 'postgres',
    host: 'localhost',
    database: process.env.PG_DATABASE_NAME,
    username: process.env.PG_DATABASE_USERNAME,
    password: process.env.PG_DATABASE_PASSWORD,
    entities: [SlugSubscription, Gwei, GweiStatus, LastSavedPrice],
    synchronize: process.env.ENVIRONMENT === 'development',
}).then((createdConnection) => {
    connection = createdConnection
    return;
});

@Entity()
export class SlugSubscription {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        unique: true
    })
    slug!: string;

    @Column({
        length: 32
    })
    discordUserId!: string;

    @Column({
        default: new Date(),
        type: 'timestamp with time zone'
    })
    createdAt!: Date;
};

@Entity()
export class Gwei {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    value!: number;
}

@Entity()
export class GweiStatus {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        default: false
    })
    alreadySent!: boolean;
}

@Entity()
export class LastSavedPrice {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        unique: true
    })
    slug!: string;

    @Column({
        type: 'double precision'
    })
    price!: number;

    @Column({
        type: 'timestamp with time zone'
    })
    lastSaved!: Date;

}
