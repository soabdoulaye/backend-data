import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    username!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string; // Hashed password

    @Column({ nullable: true })
    two_factor_secret?: string; // Secret for TOTP-based 2FA

    @Column({ default: false })
    two_factor_enabled!: boolean; // Whether 2FA is enabled for this user

    @Column({ nullable: true })
    profile_picture?: string; // URL to profile picture

    @Column({ default: 'user' })
    role!: string; // 'user' or 'admin'

    @Column({ default: true })
    is_active!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @Column({ nullable: true })
    last_login_at?: Date;
}
