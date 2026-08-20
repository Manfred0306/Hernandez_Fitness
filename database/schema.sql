IF DB_ID(N'DB_Hernandez_Fitness') IS NULL
  CREATE DATABASE [DB_Hernandez_Fitness];
GO

/* Ejecutar en la base de datos DB_Hernandez_Fitness */
USE [DB_Hernandez_Fitness];
GO
CREATE TABLE Roles (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Nombre NVARCHAR(30) NOT NULL UNIQUE,
  CONSTRAINT CK_Roles_Nombre CHECK (Nombre IN ('Administrador', 'Entrenador'))
);

CREATE TABLE Usuarios (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Cedula NVARCHAR(30) NOT NULL UNIQUE,
  NombreCompleto NVARCHAR(150) NOT NULL,
  Email NVARCHAR(150) NOT NULL UNIQUE,
  PasswordHash NVARCHAR(255) NOT NULL,
  IdRol INT NOT NULL REFERENCES Roles(Id),
  Activo BIT NOT NULL CONSTRAINT DF_Usuarios_Activo DEFAULT 1,
  EsAdministradorPrincipal BIT NOT NULL CONSTRAINT DF_Usuarios_Principal DEFAULT 0,
  FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Usuarios_Fecha DEFAULT SYSDATETIME()
);

CREATE TABLE Entrenadores (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  IdUsuario INT NOT NULL UNIQUE REFERENCES Usuarios(Id),
  HorarioInicio TIME NOT NULL,
  HorarioFin TIME NOT NULL,
  CONSTRAINT CK_Entrenadores_Horario CHECK (HorarioInicio < HorarioFin)
);

CREATE TABLE HorariosEntrenadores (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  IdEntrenador INT NOT NULL REFERENCES Entrenadores(Id),
  DiaSemana TINYINT NOT NULL CHECK (DiaSemana BETWEEN 1 AND 7),
  HoraInicio TIME NOT NULL,
  HoraFin TIME NOT NULL,
  CONSTRAINT CK_HorariosEntrenadores_Rango CHECK (HoraInicio < HoraFin),
  CONSTRAINT UQ_HorariosEntrenadores_Dia UNIQUE(IdEntrenador, DiaSemana)
);

CREATE TABLE Clientes (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  IdUsuario INT NULL UNIQUE REFERENCES Usuarios(Id),
  Cedula NVARCHAR(30) NOT NULL UNIQUE,
  NombreCompleto NVARCHAR(150) NOT NULL,
  Edad TINYINT NOT NULL CONSTRAINT CK_Clientes_Edad CHECK (Edad BETWEEN 1 AND 120),
  LesionesEnfermedades NVARCHAR(1000) NULL,
  PlanAdquirido NVARCHAR(100) NOT NULL,
  IdEntrenadorAsignado INT NULL REFERENCES Entrenadores(Id),
  Activo BIT NOT NULL CONSTRAINT DF_Clientes_Activo DEFAULT 1
);

CREATE TABLE Mediciones (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  IdCliente INT NOT NULL REFERENCES Clientes(Id),
  IdEntrenador INT NOT NULL REFERENCES Entrenadores(Id),
  FechaMedicion DATE NOT NULL,
  Estatura DECIMAL(5,2) NULL, Peso DECIMAL(5,2) NULL, MasaMuscular DECIMAL(5,2) NULL,
  PorcentajeGrasa DECIMAL(5,2) NULL, Cintura DECIMAL(5,2) NULL, Cadera DECIMAL(5,2) NULL,
  BrazoIzquierdo DECIMAL(5,2) NULL, BrazoDerecho DECIMAL(5,2) NULL,
  PiernaIzquierda DECIMAL(5,2) NULL, PiernaDerecha DECIMAL(5,2) NULL,
  PantorrillaIzquierda DECIMAL(5,2) NULL, PantorrillaDerecha DECIMAL(5,2) NULL,
  Pectoral DECIMAL(5,2) NULL, Espalda DECIMAL(5,2) NULL
);

CREATE TABLE SesionesPersonalizadas (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  IdEntrenador INT NOT NULL REFERENCES Entrenadores(Id),
  IdCliente INT NOT NULL REFERENCES Clientes(Id),
  FechaHoraInicio DATETIME2 NOT NULL,
  FechaHoraFin DATETIME2 NOT NULL,
  CONSTRAINT CK_Sesiones_Rango CHECK (FechaHoraInicio < FechaHoraFin)
);
GO
CREATE INDEX IX_Mediciones_ClienteFecha ON Mediciones(IdCliente, FechaMedicion DESC);
CREATE INDEX IX_Sesiones_EntrenadorFecha ON SesionesPersonalizadas(IdEntrenador, FechaHoraInicio);
GO
INSERT INTO Roles (Nombre) VALUES ('Administrador'), ('Entrenador');
GO

/* Usuarios de prueba. Contraseña para ambos: password */
DECLARE @AdministradorId INT = (SELECT Id FROM Roles WHERE Nombre = 'Administrador');
DECLARE @EntrenadorRolId INT = (SELECT Id FROM Roles WHERE Nombre = 'Entrenador');
DECLARE @PasswordHash NVARCHAR(255) = '$2b$10$tCr1okKL6Ru70Y3zgtigtuQVo361io2oJ/tyXSfqIFB05DNVX/lxO';

INSERT INTO Usuarios (Cedula, NombreCompleto, Email, PasswordHash, IdRol, EsAdministradorPrincipal)
VALUES ('ADMIN-001', 'Andrey Administrador', 'andrey@hernandezfitness.local', @PasswordHash, @AdministradorId, 1);

INSERT INTO Usuarios (Cedula, NombreCompleto, Email, PasswordHash, IdRol)
VALUES ('ENT-001', 'Oscar Entrenador', 'oscar@hernandezfitness.local', @PasswordHash, @EntrenadorRolId);

DECLARE @OscarEntrenadorUsuarioId INT = SCOPE_IDENTITY();

INSERT INTO Entrenadores (IdUsuario, HorarioInicio, HorarioFin)
VALUES (@OscarEntrenadorUsuarioId, '06:00', '18:00');

DECLARE @OscarEntrenadorId INT = SCOPE_IDENTITY();
INSERT INTO HorariosEntrenadores(IdEntrenador,DiaSemana,HoraInicio,HoraFin)
SELECT @OscarEntrenadorId, Dia, '06:00', '18:00' FROM (VALUES(1),(2),(3),(4),(5)) D(Dia);
