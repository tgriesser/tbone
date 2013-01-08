//
// Tbone - Backbone for Appcelerator Titanium
//
// @license MIT
// @author  Tim Griesser
//
(function (Tbone) {

  module.exports = Tbone();

})(function () {
  
  var Tbone = {};
  var ioc = require("ioc");
  var _ = ioc.resolve("underscore");

  var Backbone = ioc.resolve("backbone");

  Tbone.$ = Backbone.$ = ioc.resolve("$");
  Tbone.Events     = Backbone.Events;
  Tbone.Model      = Backbone.Model;
  Tbone.Collection = Backbone.Collection;

  _.extend(Tbone, Backbone.Events);
  
  // Tbone.View
  // -------------

  // Creating a Tbone.View creates its initial View element,
  // Similar to a Backbone.View, other than
  // not calling this.delegateEvents explicitly
  var View = Tbone.View = function(options) {
    this.cid = _.uniqueId('cid');
    this._configure(options || {});
    this._ensureElement(options || {});
    this.initialize.apply(this, arguments);
  };

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events', 'stylesheet'];

  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  var viewMethods = _.pick(Backbone.View.prototype, 'render', 'initialize', '$', 'undelegateEvents', 'remove', 'undelegateEvents');

  _.extend(View.prototype, viewMethods, Backbone.Events, {
    
    // The default `tagName` of a UIElement element is `"Window"`.
    tagName: "Window",
    
    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(model, collection, id, className)*, are
    // attached directly to the view.
    _configure: function(options) {
      if (this.options) options = _.extend({}, this.options, options);
      _.extend(this, _.pick(options, viewOptions));
      return this.options = options;
    },
        
    // Ensure that the View has a Titanium Element element, by getting the
    // necessary items passed into Tbone.Make and sending them through
    _ensureElement: function() {
      var attrs;
      if (!this.el) {
        attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['className'] = _.result(this, 'className');
        this.setElement(_.result(this, 'tagName'), attrs, false);
      } else {
        this.setElement(_.result(this, 'el'), null, false);
      }
    },

    setElement: function(element, attrs, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = (element instanceof Tbone.$) ? element : Tbone.$(element, attrs);
      this.el = this.$el.context;
      if (delegate !== false) this.delegateEvents();

      // Special for window elements, bind on the window close to cleanup
      // any bound model/collection events
      this.$el.one('close', _.bind(function () {
        if (this.close) this.close();
        this.remove();
      }, this));

      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    //  *{"event id": "callback"}*
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) throw new Error('Method "' + events[key] + '" does not exist');
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        eventName += '.delegateEvents' + this.cid;
        (!selector ? this.$el : this.$(selector)).on(eventName, _.bind(method, this));
      }
    }
    
  });

  Tbone.View.extend = Backbone.View.extend;

  return Tbone;

});