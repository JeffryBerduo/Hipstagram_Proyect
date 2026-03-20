--SCRIPT PARA CREAR LAS TABLAS CON LOS CAMPOS CORRECTOS 
--SE DEBE ELIMINAR LAS TABLAS EXISTENTES ANTES DE EJECUTAR ESTE SCRIPT

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