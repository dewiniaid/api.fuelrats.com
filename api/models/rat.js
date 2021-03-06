var _,
    linkRescues,
    moment,
    mongoose,
    normalizePlatform,
    RatSchema,
    Rescue,
    Schema,
    updateRescueCount,
    updateTimestamps,
    winston

_ = require( 'underscore' )
moment = require( 'moment' )
mongoose = require( 'mongoose' )
winston = require( 'winston' )

mongoose.Promise = global.Promise

Rescue = require( './rescue' )

Schema = mongoose.Schema





RatSchema = new Schema({
  archive: {
    default: false,
    type: Boolean
  },
  CMDRname: {
    type: String
  },
  createdAt: {
    type: Date
  },
  data: {
    default: {},
    type: Schema.Types.Mixed
  },
  drilled: {
    default: {
      dispatch: false,
      rescue: false
    },
    type: {
      dispatch: {
        type: Boolean
      },
      rescue: {
        type: Boolean
      }
    }
  },
  lastModified: {
    type: Date
  },
  joined: {
    default: Date.now(),
    type: Date
  },
  nicknames: {
    default: [],
    type: [{
      type: String
    }]
  },
  platform: {
    default: 'pc',
    enum: [
      'pc',
      'xb'
    ],
    type: String
  },
  rescues: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Rescue'
    }]
  },
  rescueCount: {
    default: 0,
    index: true,
    type: Number
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  versionKey: false
})





linkRescues = function ( next ) {
  var rat

  rat = this

  rat.rescues = rat.rescues || []
  
  mongoose.models.Rescue.update({
    unidentifiedRats: rat.CMDRname.replace(/cmdr /i, '').replace(/\s\s+/g, ' ').trim()
  }, {
    $pull: {
      unidentifiedRats: rat.CMDRname.replace(/cmdr /i, '').replace(/\s\s+/g, ' ').trim()
    },
    $push: {
      rats: rat._id
    }
  })
  .then( function () {
    mongoose.models.Rescue.find({
      rats: rat._id
    })
    .then( function ( rescues ) {
      rescues.forEach( function ( rescue, index, rescues ) {
        this.rescues.push( rescue._id )
      })
      if(this.rescues)
        this.rescueCount = this.rescues.length;
    else
        this.rescueCount = 0;
      next()
    })
    .catch( next )
  })
}

normalizePlatform = function ( next ) {
  this.platform = this.platform.toLowerCase().replace( /^xb\s*1|xbox|xbox1|xbone|xbox\s*one$/g, 'xb' )

  next()
}

updateTimestamps = function ( next ) {
  var timestamp

  timestamp = new Date()

  if ( !this.open ) {
    this.active = false
  }

  if ( this.isNew ) {
    this.createdAt = this.createdAt || timestamp
  }

  this.lastModified = timestamp

  next()
}

sanitizeInput = function ( next ) {
    var rat = this
    if(rat && rat.CMDRname)
        rat.CMDRname = rat.CMDRname.replace(/cmdr /i, '').replace(/\s\s+/g, ' ').trim()
    next()
}




RatSchema.pre( 'save', sanitizeInput )
RatSchema.pre( 'save', updateTimestamps )
RatSchema.pre( 'save', normalizePlatform )
RatSchema.pre( 'save', linkRescues )

RatSchema.pre( 'update', sanitizeInput )
RatSchema.pre( 'update', updateTimestamps )

RatSchema.set( 'toJSON', {
  virtuals: true
})

RatSchema.plugin( require( 'mongoosastic' ) )

if ( mongoose.models.Rat ) {
  module.exports = mongoose.model( 'Rat' )
} else {
  module.exports = mongoose.model( 'Rat', RatSchema )
}

//module.exports.synchronize()
