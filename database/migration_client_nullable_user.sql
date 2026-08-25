USE [DB_Hernandez_Fitness];
GO

DECLARE @UniqueConstraint SYSNAME;
SELECT TOP 1 @UniqueConstraint = kc.name
FROM sys.key_constraints kc
JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id AND ic.index_id = kc.unique_index_id
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE kc.parent_object_id = OBJECT_ID('dbo.Clientes')
  AND kc.type = 'UQ'
  AND c.name = 'IdUsuario';

IF @UniqueConstraint IS NOT NULL
  EXEC('ALTER TABLE dbo.Clientes DROP CONSTRAINT ' + QUOTENAME(@UniqueConstraint));

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.Clientes') AND name='UX_Clientes_IdUsuario_NotNull')
  CREATE UNIQUE INDEX UX_Clientes_IdUsuario_NotNull ON dbo.Clientes(IdUsuario) WHERE IdUsuario IS NOT NULL;
GO
