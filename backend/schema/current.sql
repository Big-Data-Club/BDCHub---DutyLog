-- Consolidated schema reconstructed from repository SQL, not a Neon dump.
-- NEW databases only. Existing deployments continue using migration history.
-- Tables contain their final columns; indexes, constraints and seed defaults follow.
-- See README.md for scope and regeneration.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;


CREATE TABLE public.duty_presence_logs (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    room_id character varying(64) NOT NULL,
    student_id character varying(64) NOT NULL,
    student_name character varying(255) NOT NULL,
    check_in_at timestamp with time zone NOT NULL,
    check_out_at timestamp with time zone,
    duration_seconds integer,
    scan_method character varying(32) DEFAULT 'BARCODE'::character varying NOT NULL,
    is_on_duty boolean DEFAULT false NOT NULL,
    client_scan_uuid character varying(64),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    scanner_id character varying(64),
    scanner_name character varying(255),
    is_valid_member boolean DEFAULT true NOT NULL,
    is_system_user boolean DEFAULT false NOT NULL
);



CREATE SEQUENCE public.duty_presence_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.duty_presence_logs_id_seq OWNED BY public.duty_presence_logs.id;



CREATE TABLE public.duty_shift_records (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    room_id character varying(64) NOT NULL,
    duty_staff_id character varying(64) NOT NULL,
    duty_staff_name character varying(255) NOT NULL,
    duty_staff_email character varying(255),
    start_time timestamp with time zone DEFAULT now() NOT NULL,
    end_time timestamp with time zone,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



CREATE SEQUENCE public.duty_shift_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.duty_shift_records_id_seq OWNED BY public.duty_shift_records.id;



CREATE TABLE public.duty_shifts (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    room_id character varying(64) NOT NULL,
    assigned_student_id character varying(64) NOT NULL,
    assigned_student_name character varying(255) NOT NULL,
    day_of_week smallint NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT duty_shifts_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 7)))
);



CREATE SEQUENCE public.duty_shifts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.duty_shifts_id_seq OWNED BY public.duty_shifts.id;



CREATE TABLE public.organization_members (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    user_id bigint NOT NULL,
    student_code character varying(64),
    email character varying(255),
    full_name character varying(255),
    org_role character varying(32) DEFAULT 'MEMBER'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);



CREATE SEQUENCE public.organization_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.organization_members_id_seq OWNED BY public.organization_members.id;



CREATE TABLE public.organizations (
    id bigint NOT NULL,
    slug character varying(64) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);



CREATE TABLE public.rooms (
    id character varying(64) NOT NULL,
    organization_id bigint NOT NULL,
    campus character varying(64) NOT NULL,
    building character varying(64) NOT NULL,
    room_number character varying(32) NOT NULL,
    name character varying(128) NOT NULL,
    capacity integer DEFAULT 30 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rooms_capacity_check CHECK ((capacity > 0))
);



ALTER TABLE ONLY public.duty_presence_logs ALTER COLUMN id SET DEFAULT nextval('public.duty_presence_logs_id_seq'::regclass);



ALTER TABLE ONLY public.duty_shift_records ALTER COLUMN id SET DEFAULT nextval('public.duty_shift_records_id_seq'::regclass);



ALTER TABLE ONLY public.duty_shifts ALTER COLUMN id SET DEFAULT nextval('public.duty_shifts_id_seq'::regclass);



ALTER TABLE ONLY public.organization_members ALTER COLUMN id SET DEFAULT nextval('public.organization_members_id_seq'::regclass);



ALTER TABLE ONLY public.duty_presence_logs
    ADD CONSTRAINT duty_presence_logs_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.duty_shift_records
    ADD CONSTRAINT duty_shift_records_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.duty_shifts
    ADD CONSTRAINT duty_shifts_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);



ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT uq_org_member UNIQUE (organization_id, user_id);



CREATE INDEX idx_org_members_code ON public.organization_members USING btree (organization_id, student_code);



CREATE INDEX idx_org_members_email ON public.organization_members USING btree (organization_id, email);



CREATE INDEX idx_org_members_user ON public.organization_members USING btree (user_id);



CREATE INDEX idx_presence_client_uuid ON public.duty_presence_logs USING btree (client_scan_uuid);



CREATE INDEX idx_presence_dedup ON public.duty_presence_logs USING btree (room_id, student_id, check_in_at DESC);



CREATE INDEX idx_presence_room_checkin ON public.duty_presence_logs USING btree (room_id, check_in_at DESC);



CREATE INDEX idx_presence_scanner ON public.duty_presence_logs USING btree (scanner_id);



CREATE INDEX idx_presence_student ON public.duty_presence_logs USING btree (student_id);



CREATE INDEX idx_presence_system_user ON public.duty_presence_logs USING btree (room_id, is_system_user);



CREATE INDEX idx_presence_valid_member ON public.duty_presence_logs USING btree (room_id, is_valid_member);



CREATE INDEX idx_rooms_campus ON public.rooms USING btree (campus);



CREATE INDEX idx_rooms_org ON public.rooms USING btree (organization_id);



CREATE INDEX idx_shift_records_org ON public.duty_shift_records USING btree (organization_id);



CREATE INDEX idx_shift_records_room ON public.duty_shift_records USING btree (room_id, start_time DESC);



CREATE INDEX idx_shift_records_staff ON public.duty_shift_records USING btree (duty_staff_id, status);



CREATE INDEX idx_shifts_room_day ON public.duty_shifts USING btree (room_id, day_of_week);



CREATE INDEX idx_shifts_student ON public.duty_shifts USING btree (assigned_student_id);



ALTER TABLE ONLY public.duty_presence_logs
    ADD CONSTRAINT duty_presence_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.duty_presence_logs
    ADD CONSTRAINT duty_presence_logs_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.duty_shift_records
    ADD CONSTRAINT duty_shift_records_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.duty_shift_records
    ADD CONSTRAINT duty_shift_records_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.duty_shifts
    ADD CONSTRAINT duty_shifts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.duty_shifts
    ADD CONSTRAINT duty_shifts_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Default rows from repository SQL only.
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




















SELECT pg_catalog.setval('public.duty_presence_logs_id_seq', 1, false);



SELECT pg_catalog.setval('public.duty_shift_records_id_seq', 1, false);



SELECT pg_catalog.setval('public.duty_shifts_id_seq', 1, false);



SELECT pg_catalog.setval('public.organization_members_id_seq', 1, false);
