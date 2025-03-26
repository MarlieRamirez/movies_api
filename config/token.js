import bcrypt from 'bcryptjs';

export var new_token = function create_token(pwd) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(pwd, salt);
}

export const checked = (pwd, hash) => {
    return bcrypt.compareSync(pwd, hash)
}
