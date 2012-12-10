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

  _.extend(Tbone, {
    
    $: ioc.resolve("$"),
    Events: Backbone.Events,
    Collection: Backbone.Collection,
    Model: Backbone.Model
  
  }, Backbone.Events);

  var ArrayProto = Array.prototype;

  var slice = ArrayProto.slice;

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

  _.extend(View.prototype, Backbone.Events, {
    
    // The default `tagName` of a UIElement element is `"Window"`.
    tagName: "Window",
    
    // $ a work in progress $ for selecting an element in the current context by id
    // and doing things like event binding, attribute setting, etc.
    $: function(selector) {
      return this.$el.find(selector);
    },
    
    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function() {},
    
    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate UI elements. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },
    
    // Clean up references to this UI in order to prevent latent effects and
    // memory leaks
    dispose: function() {
      if (this.model && this.model.off) this.model.off(null, null, this);
      if (this.collection && this.collection.off) this.collection.off(null, null, this);
      return this;
    },
    
    // Remove this view, and call dispose
    remove: function() {
      this.dispose();
      this.$el.remove();
      return this;
    },

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
        this.dispose();
        if (this.close) this.close();
      }, this));

      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    //  *{"event id": "callback"}*
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    delegateEvents: function() {
      if (!(events || (events = _.result(this, 'events')))) return;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) throw new Error('Method "' + events[key] + '" does not exist');
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        $elem = (!selector ? this.$el : this.$(selector));
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        this.$el.on(eventName, method);
      }
    },
    
    undelegateEvents: function() {
      return this.$el.off(".delegateEvents" + this.cid);
    }

  });

  Tbone.View.extend = Backbone.View.extend;

  return Tbone;

});