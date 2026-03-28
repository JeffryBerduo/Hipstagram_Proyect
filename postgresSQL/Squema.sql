--SCRIPT PARA CREAR LAS TABLAS CON LOS CAMPOS CORRECTOS 
--SE DEBE ELIMINAR LAS TABLAS EXISTENTES ANTES DE EJECUTAR ESTE SCRIPT POR COMPLETO

CREATE TABLE usuarios (
  id             SERIAL       PRIMARY KEY,
  username       VARCHAR(100) NOT NULL UNIQUE,
  email          VARCHAR(100) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(10)  NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  fecha_registro TIMESTAMP    DEFAULT NOW()
);


CREATE TABLE publicaciones (
  id          SERIAL       PRIMARY KEY,
  user_id     INT          NOT NULL,
  description VARCHAR(128),
  image_url   VARCHAR(255),
  status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                           CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_publicaciones_user
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);


CREATE TABLE hashtags (
  id   SERIAL      PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- crear relación publicaciones_hashtags
CREATE TABLE publicaciones_hashtags (
  post_id    INT NOT NULL,
  hashtag_id INT NOT NULL,
  PRIMARY KEY (post_id, hashtag_id),

  CONSTRAINT fk_ph_post
    FOREIGN KEY (post_id)    REFERENCES publicaciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_ph_hashtag
    FOREIGN KEY (hashtag_id) REFERENCES hashtags(id)      ON DELETE CASCADE
);

-- Votos (likes/dislikes)
CREATE TABLE votos (
  id         SERIAL      PRIMARY KEY,
  user_id    INT         NOT NULL,
  post_id    INT         NOT NULL,
  tipo_voto  SMALLINT    NOT NULL CHECK (tipo_voto IN (1, -1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un usuario solo puede votar una vez por publicación
  CONSTRAINT uq_voto_user_post UNIQUE (user_id, post_id),

  CONSTRAINT fk_votos_user
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  CONSTRAINT fk_votos_post
    FOREIGN KEY (post_id) REFERENCES publicaciones(id) ON DELETE RESTRICT
);

-- Comentarios
CREATE TABLE comentarios (
  id         SERIAL      PRIMARY KEY,
  post_id    INT         NOT NULL,
  user_id    INT         NOT NULL,
  contenido  TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_comentarios_post
    FOREIGN KEY (post_id) REFERENCES publicaciones(id) ON DELETE RESTRICT,
  CONSTRAINT fk_comentarios_user
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- Tabla de palabras prohibidas
CREATE TABLE palabras_prohibidas (
  id         SERIAL       PRIMARY KEY,
  palabra    VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Auditoría
CREATE TABLE auditoria (
  id            SERIAL       PRIMARY KEY,
  timestamp     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  user_id       INT,
  rol           VARCHAR(10),
  accion        VARCHAR(100) NOT NULL,
  entidad_tipo  VARCHAR(50),
  entidad_id    INT,
  resultado     VARCHAR(20),
  ip            VARCHAR(45)
);

-- Índices
CREATE INDEX idx_votos_post_id       ON votos(post_id);
CREATE INDEX idx_comentarios_post_id ON comentarios(post_id);
CREATE INDEX idx_auditoria_accion    ON auditoria(accion);
CREATE INDEX idx_auditoria_timestamp ON auditoria(timestamp DESC);