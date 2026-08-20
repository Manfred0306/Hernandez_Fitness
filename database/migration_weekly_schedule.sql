USE [DB_Hernandez_Fitness];
GO
IF OBJECT_ID('HorariosEntrenadores','U') IS NULL
BEGIN
  CREATE TABLE HorariosEntrenadores (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    IdEntrenador INT NOT NULL REFERENCES Entrenadores(Id),
    DiaSemana TINYINT NOT NULL CHECK (DiaSemana BETWEEN 1 AND 7),
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    CONSTRAINT CK_HorariosEntrenadores_Rango CHECK (HoraInicio < HoraFin),
    CONSTRAINT UQ_HorariosEntrenadores_Dia UNIQUE(IdEntrenador, DiaSemana)
  );
  INSERT INTO HorariosEntrenadores(IdEntrenador,DiaSemana,HoraInicio,HoraFin)
  SELECT Id,D.Dia,HorarioInicio,HorarioFin FROM Entrenadores CROSS JOIN (VALUES(1),(2),(3),(4),(5)) D(Dia);
END
GO
