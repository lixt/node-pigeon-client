'use strict';

require('rootpath');

var _      = require('underscore')
  , Error  = require('lib/error')
  , logger = require('lib/logger')
  , type   = require('lib/util/type')
  ;

function error(err) {
  return { '$err': err };
}

function java(T, G, js) {
  return {
    '$class': T,
    '$T'    : arguments.length === 2 ? undefined : G,
    '$'     : arguments.length === 2 ? G : js
  };
}

function template(T, G, js) {
  switch(T) {
    case 'null'   :
      return java(T, js);

    case 'int'    :
    case 'long'   :
    case 'double' :
    case 'boolean':
      js = G;
      G = null;
      if (!type['is' + T](js)) {
        return error(new Error('Param', 'Param(%j) is not a Java `%s`.', js, T));
      }
      return java(T, js);
    case 'java.lang.Integer':
    case 'java.lang.Long'   :
    case 'java.lang.Double' :
    case 'java.lang.Boolean':
    case 'java.lang.String' :
    case 'java.lang.Object' :
    case 'java.util.Date'   :
      js = G;
      G = null;
      if (_.isUndefined(js) || _.isNull(js)) {
        return exports.null();
      }
      if (!type['is' + T.slice('java.lang.'.length)](js)) {
        return error(new Error('Param', 'Param(%j) is not a Java `%s`.', js, T));
      }
      return java(T, js);
    case 'java.util.List':
    case 'java.util.Set' :
    case 'array'         :
      if (!_.isString(G)) {
        return error(new Error('Param', '(%j) is not a Java `%s` generic type.', G, T));
      }
      if (_.isUndefined(js) || _.isNull(js)) {
        return exports.null();
      }
      if (!type.isarray(js)) {
        return error(new Error('Param', 'Param(%j) is not a Java `%s`.', js, T));
      }
      return java(T, G, js.map(function(j) {
        return java(G, j);
      }));
    default:
      js = G;
      G = null;
      if (!_.isString(T)) {
        return error(new Error('Param', '(%j) is not a Java user-defined class.', T));
      }
      return java(T, js);
  }
}

exports = module.exports = {
  null   : _.bind(template, null, 'null'),

  int    : _.bind(template, null, 'int'    ),
  long   : _.bind(template, null, 'long'   ),
  double : _.bind(template, null, 'double' ),
  boolean: _.bind(template, null, 'boolean'),

  Integer: _.bind(template, null, 'java.lang.Integer'),
  Long   : _.bind(template, null, 'java.lang.Long'   ),
  Double : _.bind(template, null, 'java.lang.Double' ),
  Boolean: _.bind(template, null, 'java.lang.Boolean'),
  String : _.bind(template, null, 'java.lang.String' ),
  Object : _.bind(template, null, 'java.lang.Object' ),
  Date   : _.bind(template, null, 'java.util.Date'   ),

  List   : {
    int    : _.bind(template, null, 'java.util.List', 'int'              ),
    long   : _.bind(template, null, 'java.util.List', 'long'             ),
    double : _.bind(template, null, 'java.util.List', 'double'           ),
    boolean: _.bind(template, null, 'java.util.List', 'boolean'          ),

    Integer: _.bind(template, null, 'java.util.List', 'java.lang.Integer'),
    Long   : _.bind(template, null, 'java.util.List', 'java.lang.Long'   ),
    Double : _.bind(template, null, 'java.util.List', 'java.lang.Double' ),
    Boolean: _.bind(template, null, 'java.util.List', 'java.lang.Boolean'),
    String : _.bind(template, null, 'java.util.List', 'java.lang.String' ),
    Object : _.bind(template, null, 'java.util.List', 'java.lang.Object' ),
    Date   : _.bind(template, null, 'java.util.List', 'java.lang.Date'   ),

    Class  : _.bind(template, null, 'java.util.List'                     )
  },

  Set    : {
    int    : _.bind(template, null, 'java.util.Set', 'int'              ),
    long   : _.bind(template, null, 'java.util.Set', 'long'             ),
    double : _.bind(template, null, 'java.util.Set', 'double'           ),
    boolean: _.bind(template, null, 'java.util.Set', 'boolean'          ),
    Integer: _.bind(template, null, 'java.util.Set', 'java.lang.Integer'),

    Long   : _.bind(template, null, 'java.util.Set', 'java.lang.Long'   ),
    Double : _.bind(template, null, 'java.util.Set', 'java.lang.Double' ),
    Boolean: _.bind(template, null, 'java.util.Set', 'java.lang.Boolean'),
    String : _.bind(template, null, 'java.util.Set', 'java.lang.String' ),
    Object : _.bind(template, null, 'java.util.Set', 'java.lang.Object' ),
    Date   : _.bind(template, null, 'java.util.Set', 'java.lang.Date'   ),

    Class  : _.bind(template, null, 'java.util.Set'                     )
  },

  array  : {
    int    : _.bind(template, null, 'array', 'int'              ),
    long   : _.bind(template, null, 'array', 'long'             ),
    double : _.bind(template, null, 'array', 'double'           ),
    boolean: _.bind(template, null, 'array', 'boolean'          ),
    Integer: _.bind(template, null, 'array', 'java.lang.Integer'),
    Long   : _.bind(template, null, 'array', 'java.lang.Long'   ),
    Double : _.bind(template, null, 'array', 'java.lang.Double' ),
    Boolean: _.bind(template, null, 'array', 'java.lang.Boolean'),
    String : _.bind(template, null, 'array', 'java.lang.String' ),
    Object : _.bind(template, null, 'array', 'java.lang.Object' ),
    Date   : _.bind(template, null, 'array', 'java.lang.Date'   ),
    Class  : _.bind(template, null, 'array'                     )
  },

  Class  : _.bind(template, null)
};
