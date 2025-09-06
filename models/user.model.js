import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({

    // User Name
    name: {
        type: String,
        required: true,
        minlength: 4,
        trim: true
    },
    //User Email
    email: {
        type: String,
          required: true,
          unique: true,
          match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                 'Please fill a valid email address']
    },
    //User Password
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    // User Role
      role: { 
        type: String, 
        enum: ['investor', 'entrepreneur'], 
        required: true 
    },
    // User bio
    bio: {
       type: String,
       default: ''    
    },
    // is user Email verfied
      isEmailVerified: { 
        type: Boolean,
        default: false,
    },
    // User refresh token
       refreshToken: {
        type: String,
        default: null
    },
    // User profile image (avatar)
      avatar: {
        type: String,
        default: ''
     },
     //  Online
    isOnline: {
      type: Boolean,
      default: false
    },
    lastActiveAt: {
      type: Date,
      default: null
    },
    //  User Location
     location: {    
      type: String,
      default: '',
    },
     createdAt: {
        type: Date,
        default: Date.now
    }, 
}, { timestamps: true } 
);


// Password hashing middleware
userSchema.pre('save', async function(next){

       // Skip hashing if the password hasn't been modified
        if(!this.isModified('password')) return next();
        
        // Hash the Password
       await bcrypt.genSalt(10)
        .then(salt => bcrypt.hash(this.password, salt)) // Hash password
        .then(hash => {
            this.password = hash; 
            next();
        })
        .catch(error => next(error));
})

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (password) {
           return await bcrypt.compare(password, this.password)
}

// Generate Access Token
userSchema.methods.generateAccessToken = function() {
       return jwt.sign(
        { id: this._id, email: this.email, role: this.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function() {
       return jwt.sign(
        {  email: this.email, }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
};

export default mongoose.model('User', userSchema);


// validate: {
//       validator: function(v) {
//         return v.length === 4;
//       },
//       message: props => `${props.value} must be exactly 4 characters long!`
//     }


