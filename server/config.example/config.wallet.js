module.exports = {

  // 数据库
  db: {

    host: `localhost`,

    database: "flying_pub",

    user: "postgres",

    password: "39f12851f5275222e8b50fddddf04ee4",

    dialect: `postgres`,

  },

  // 加密相关的 key
  encryption: {

    salt: 736773,

    aesKey256: [16,14,22,11,8,30,27,31,15,1,12,21,26,4,20,24,11,2,29,14,5,4,2,25,8,30,27,26,20,2,14,13,],

  },
};