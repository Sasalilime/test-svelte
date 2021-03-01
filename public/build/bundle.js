
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/List1.svelte generated by Svelte v3.32.1 */

    const file = "src/List1.svelte";

    function create_fragment(ctx) {
    	let div;
    	let h2;
    	let t0;
    	let t1;
    	let ul;
    	let li0;
    	let t3;
    	let li1;
    	let t5;
    	let li2;
    	let t7;
    	let li3;
    	let t9;
    	let li4;
    	let t11;
    	let p;
    	let t12;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(/*montitre*/ ctx[0]);
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Ligne 1";
    			t3 = space();
    			li1 = element("li");
    			li1.textContent = "Ligne 2";
    			t5 = space();
    			li2 = element("li");
    			li2.textContent = "Ligne 3";
    			t7 = space();
    			li3 = element("li");
    			li3.textContent = "Ligne 4";
    			t9 = space();
    			li4 = element("li");
    			li4.textContent = "Ligne 5";
    			t11 = space();
    			p = element("p");
    			t12 = text(/*nationality*/ ctx[1]);
    			add_location(h2, file, 10, 5, 132);
    			add_location(li0, file, 12, 8, 191);
    			add_location(li1, file, 13, 8, 216);
    			add_location(li2, file, 14, 8, 241);
    			add_location(li3, file, 15, 8, 266);
    			add_location(li4, file, 16, 8, 291);
    			attr_dev(ul, "class", "text-red-500");
    			add_location(ul, file, 11, 4, 156);
    			add_location(p, file, 19, 4, 323);
    			add_location(div, file, 10, 0, 127);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    			append_dev(ul, t7);
    			append_dev(ul, li3);
    			append_dev(ul, t9);
    			append_dev(ul, li4);
    			append_dev(div, t11);
    			append_dev(div, p);
    			append_dev(p, t12);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*montitre*/ 1) set_data_dev(t0, /*montitre*/ ctx[0]);
    			if (dirty & /*nationality*/ 2) set_data_dev(t12, /*nationality*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List1", slots, []);
    	let { montitre } = $$props;
    	let { nationality } = $$props;
    	let { taille } = $$props;
    	let { married } = $$props;
    	let { religion } = $$props;
    	const writable_props = ["montitre", "nationality", "taille", "married", "religion"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List1> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("montitre" in $$props) $$invalidate(0, montitre = $$props.montitre);
    		if ("nationality" in $$props) $$invalidate(1, nationality = $$props.nationality);
    		if ("taille" in $$props) $$invalidate(2, taille = $$props.taille);
    		if ("married" in $$props) $$invalidate(3, married = $$props.married);
    		if ("religion" in $$props) $$invalidate(4, religion = $$props.religion);
    	};

    	$$self.$capture_state = () => ({
    		montitre,
    		nationality,
    		taille,
    		married,
    		religion
    	});

    	$$self.$inject_state = $$props => {
    		if ("montitre" in $$props) $$invalidate(0, montitre = $$props.montitre);
    		if ("nationality" in $$props) $$invalidate(1, nationality = $$props.nationality);
    		if ("taille" in $$props) $$invalidate(2, taille = $$props.taille);
    		if ("married" in $$props) $$invalidate(3, married = $$props.married);
    		if ("religion" in $$props) $$invalidate(4, religion = $$props.religion);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [montitre, nationality, taille, married, religion];
    }

    class List1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			montitre: 0,
    			nationality: 1,
    			taille: 2,
    			married: 3,
    			religion: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List1",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*montitre*/ ctx[0] === undefined && !("montitre" in props)) {
    			console.warn("<List1> was created without expected prop 'montitre'");
    		}

    		if (/*nationality*/ ctx[1] === undefined && !("nationality" in props)) {
    			console.warn("<List1> was created without expected prop 'nationality'");
    		}

    		if (/*taille*/ ctx[2] === undefined && !("taille" in props)) {
    			console.warn("<List1> was created without expected prop 'taille'");
    		}

    		if (/*married*/ ctx[3] === undefined && !("married" in props)) {
    			console.warn("<List1> was created without expected prop 'married'");
    		}

    		if (/*religion*/ ctx[4] === undefined && !("religion" in props)) {
    			console.warn("<List1> was created without expected prop 'religion'");
    		}
    	}

    	get montitre() {
    		throw new Error("<List1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set montitre(value) {
    		throw new Error("<List1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nationality() {
    		throw new Error("<List1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nationality(value) {
    		throw new Error("<List1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get taille() {
    		throw new Error("<List1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set taille(value) {
    		throw new Error("<List1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get married() {
    		throw new Error("<List1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set married(value) {
    		throw new Error("<List1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get religion() {
    		throw new Error("<List1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set religion(value) {
    		throw new Error("<List1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Toggle.svelte generated by Svelte v3.32.1 */

    const file$1 = "src/Toggle.svelte";

    // (21:4) {#if toggle}
    function create_if_block(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Le contenu";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet.";
    			add_location(h2, file$1, 22, 8, 543);
    			add_location(p, file$1, 23, 8, 571);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*toggle*/ ctx[1] ? "montrer" : "cacher") + " svelte-1i6jz2w"));
    			add_location(div, file$1, 21, 4, 492);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*toggle*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*toggle*/ ctx[1] ? "montrer" : "cacher") + " svelte-1i6jz2w"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(21:4) {#if toggle}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let button0;
    	let t1;
    	let div0;
    	let h2;
    	let t3;
    	let p;
    	let div0_class_value;
    	let t5;
    	let button1;
    	let t7;
    	let mounted;
    	let dispose;
    	let if_block = /*toggle*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Toggle le contenu";
    			t1 = space();
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Le contenu";
    			t3 = space();
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet.";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Toggle le contenu";
    			t7 = space();
    			if (if_block) if_block.c();
    			add_location(button0, file$1, 14, 4, 216);
    			add_location(h2, file$1, 16, 8, 339);
    			add_location(p, file$1, 17, 8, 367);
    			attr_dev(div0, "class", div0_class_value = /*togglebg*/ ctx[0] ? "bg-blue-50" : "bg-red-50");
    			add_location(div0, file$1, 15, 4, 280);
    			add_location(button1, file$1, 19, 4, 413);
    			add_location(div1, file$1, 13, 0, 206);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t3);
    			append_dev(div0, p);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			append_dev(div1, t7);
    			if (if_block) if_block.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*toggleClassbg*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*toggleClass*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*togglebg*/ 1 && div0_class_value !== (div0_class_value = /*togglebg*/ ctx[0] ? "bg-blue-50" : "bg-red-50")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (/*toggle*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Toggle", slots, []);
    	let togglebg = false;

    	const toggleClassbg = () => {
    		$$invalidate(0, togglebg = !togglebg);
    	};

    	let toggle = false;

    	const toggleClass = () => {
    		$$invalidate(1, toggle = !toggle);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Toggle> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		togglebg,
    		toggleClassbg,
    		toggle,
    		toggleClass
    	});

    	$$self.$inject_state = $$props => {
    		if ("togglebg" in $$props) $$invalidate(0, togglebg = $$props.togglebg);
    		if ("toggle" in $$props) $$invalidate(1, toggle = $$props.toggle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [togglebg, toggle, toggleClassbg, toggleClass];
    }

    class Toggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toggle",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Else.svelte generated by Svelte v3.32.1 */

    const file$2 = "src/Else.svelte";

    // (18:8) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Le compteur est supérieur à 50";
    			add_location(p, file$2, 18, 8, 362);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(18:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:50) 
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Compteur entre 30 et 50";
    			add_location(p, file$2, 15, 8, 306);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(15:50) ",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#if compteur < 30}
    function create_if_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Le compteur est inférieur à 30";
    			add_location(p, file$2, 13, 8, 209);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(13:4) {#if compteur < 30}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let button;
    	let t1;
    	let h2;
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*compteur*/ ctx[0] < 30) return create_if_block$1;
    		if (/*compteur*/ ctx[0] <= 50 && /*compteur*/ ctx[0] >= 30) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			button = element("button");
    			button.textContent = "Incrementer";
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(/*compteur*/ ctx[0]);
    			t3 = space();
    			if_block.c();
    			add_location(button, file$2, 9, 4, 102);
    			add_location(h2, file$2, 10, 4, 156);
    			add_location(main, file$2, 8, 0, 91);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, button);
    			append_dev(main, t1);
    			append_dev(main, h2);
    			append_dev(h2, t2);
    			append_dev(main, t3);
    			if_block.m(main, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*increment*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*compteur*/ 1) set_data_dev(t2, /*compteur*/ ctx[0]);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Else", slots, []);
    	let compteur = 0;

    	const increment = () => {
    		$$invalidate(0, compteur = compteur + 10);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Else> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ compteur, increment });

    	$$self.$inject_state = $$props => {
    		if ("compteur" in $$props) $$invalidate(0, compteur = $$props.compteur);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [compteur, increment];
    }

    class Else extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Else",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Each.svelte generated by Svelte v3.32.1 */

    const file$3 = "src/Each.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (26:8) {#each paysList as pays, index}
    function create_each_block_1(ctx) {
    	let li;
    	let t0;
    	let t1_value = /*index*/ ctx[4] + 1 + "";
    	let t1;
    	let t2_value = /*pays*/ ctx[5] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text("#");
    			t1 = text(t1_value);
    			t2 = text(t2_value);
    			add_location(li, file$3, 26, 12, 491);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(26:8) {#each paysList as pays, index}",
    		ctx
    	});

    	return block;
    }

    // (31:8) {#each paysListKeys as obj, index (obj.id)}
    function create_each_block(key_1, ctx) {
    	let li;
    	let t0;
    	let t1_value = /*index*/ ctx[4] + "";
    	let t1;
    	let t2_value = /*obj*/ ctx[2].pays + "";
    	let t2;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			t0 = text("#");
    			t1 = text(t1_value);
    			t2 = text(t2_value);
    			add_location(li, file$3, 31, 12, 618);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(31:8) {#each paysListKeys as obj, index (obj.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let ul0;
    	let t;
    	let ul1;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let each_value_1 = /*paysList*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*paysListKeys*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*obj*/ ctx[2].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(ul0, file$3, 24, 4, 434);
    			add_location(ul1, file$3, 29, 4, 549);
    			add_location(main, file$3, 23, 0, 423);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			append_dev(main, t);
    			append_dev(main, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*paysList*/ 1) {
    				each_value_1 = /*paysList*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*paysListKeys*/ 2) {
    				each_value = /*paysListKeys*/ ctx[1];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each1_lookup, ul1, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Each", slots, []);
    	let paysList = ["Danemark", "Canada", "Mexico", "France"];

    	let paysListKeys = [
    		{ id: Math.random(), pays: "Danemark" },
    		{ id: Math.random(), pays: "Canada" },
    		{ id: Math.random(), pays: "Mexico" },
    		{ id: Math.random(), pays: "France" }
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Each> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ paysList, paysListKeys });

    	$$self.$inject_state = $$props => {
    		if ("paysList" in $$props) $$invalidate(0, paysList = $$props.paysList);
    		if ("paysListKeys" in $$props) $$invalidate(1, paysListKeys = $$props.paysListKeys);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [paysList, paysListKeys];
    }

    class Each extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Each",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Input.svelte generated by Svelte v3.32.1 */

    const file$4 = "src/Input.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let form;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let h1;
    	let t3;
    	let t4;
    	let t5;
    	let br;
    	let t6;
    	let label1;
    	let t8;
    	let input1;
    	let t9;
    	let h2;
    	let t10;
    	let t11;
    	let t12;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			form = element("form");
    			label0 = element("label");
    			label0.textContent = "Votre pays";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			h1 = element("h1");
    			t3 = text("Votre pays est ");
    			t4 = text(/*pays*/ ctx[0]);
    			t5 = space();
    			br = element("br");
    			t6 = space();
    			label1 = element("label");
    			label1.textContent = "Votre Ville";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			h2 = element("h2");
    			t10 = text("Votre ville est ");
    			t11 = text(/*ville*/ ctx[1]);
    			t12 = space();
    			button = element("button");
    			button.textContent = "Envoyer les données";
    			attr_dev(label0, "for", "pays");
    			add_location(label0, file$4, 14, 8, 182);
    			input0.value = /*pays*/ ctx[0];
    			attr_dev(input0, "id", "pays");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$4, 15, 8, 227);
    			add_location(h1, file$4, 16, 8, 297);
    			add_location(br, file$4, 17, 8, 336);
    			attr_dev(label1, "for", "ville");
    			add_location(label1, file$4, 18, 8, 350);
    			attr_dev(input1, "id", "ville");
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$4, 19, 8, 397);
    			add_location(h2, file$4, 20, 8, 455);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "2xl:bg-blue-300 rounded-2xl px-4 h-8");
    			add_location(button, file$4, 21, 8, 496);
    			attr_dev(form, "class", "");
    			add_location(form, file$4, 13, 4, 158);
    			attr_dev(main, "class", "container");
    			add_location(main, file$4, 12, 0, 129);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, form);
    			append_dev(form, label0);
    			append_dev(form, t1);
    			append_dev(form, input0);
    			append_dev(form, t2);
    			append_dev(form, h1);
    			append_dev(h1, t3);
    			append_dev(h1, t4);
    			append_dev(form, t5);
    			append_dev(form, br);
    			append_dev(form, t6);
    			append_dev(form, label1);
    			append_dev(form, t8);
    			append_dev(form, input1);
    			set_input_value(input1, /*ville*/ ctx[1]);
    			append_dev(form, t9);
    			append_dev(form, h2);
    			append_dev(h2, t10);
    			append_dev(h2, t11);
    			append_dev(form, t12);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*inpFunc*/ ctx[2], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pays*/ 1 && input0.value !== /*pays*/ ctx[0]) {
    				prop_dev(input0, "value", /*pays*/ ctx[0]);
    			}

    			if (dirty & /*pays*/ 1) set_data_dev(t4, /*pays*/ ctx[0]);

    			if (dirty & /*ville*/ 2 && input1.value !== /*ville*/ ctx[1]) {
    				set_input_value(input1, /*ville*/ ctx[1]);
    			}

    			if (dirty & /*ville*/ 2) set_data_dev(t11, /*ville*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Input", slots, []);
    	let pays = "";
    	let ville = "";

    	const inpFunc = e => {
    		$$invalidate(0, pays = e.target.value);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function input1_input_handler() {
    		ville = this.value;
    		$$invalidate(1, ville);
    	}

    	$$self.$capture_state = () => ({ pays, ville, inpFunc });

    	$$self.$inject_state = $$props => {
    		if ("pays" in $$props) $$invalidate(0, pays = $$props.pays);
    		if ("ville" in $$props) $$invalidate(1, ville = $$props.ville);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pays, ville, inpFunc, input1_input_handler];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Form.svelte generated by Svelte v3.32.1 */

    const file$5 = "src/Form.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let form;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let label1;
    	let t4;
    	let input1;
    	let t5;
    	let label2;
    	let t7;
    	let input2;
    	let t8;
    	let label3;
    	let t10;
    	let textarea;
    	let t11;
    	let br0;
    	let t12;
    	let button;
    	let t14;
    	let br1;
    	let t15;
    	let h1;
    	let t16;
    	let t17;
    	let t18;
    	let h20;
    	let t19;
    	let t20;
    	let t21;
    	let h21;
    	let t22;
    	let t23;
    	let t24;
    	let h22;
    	let t25;
    	let t26;
    	let t27;
    	let p;
    	let t28_value = /*pop*/ ctx[3] / 100 + "";
    	let t28;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			form = element("form");
    			label0 = element("label");
    			label0.textContent = "Votre pays";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			label1 = element("label");
    			label1.textContent = "La population";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			label2 = element("label");
    			label2.textContent = "La superficie";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			label3 = element("label");
    			label3.textContent = "Votre message";
    			t10 = space();
    			textarea = element("textarea");
    			t11 = space();
    			br0 = element("br");
    			t12 = space();
    			button = element("button");
    			button.textContent = "Envoyer les données";
    			t14 = space();
    			br1 = element("br");
    			t15 = space();
    			h1 = element("h1");
    			t16 = text("Votre pays est ");
    			t17 = text(/*pays*/ ctx[1]);
    			t18 = space();
    			h20 = element("h2");
    			t19 = text("La population est de ");
    			t20 = text(/*pop*/ ctx[3]);
    			t21 = space();
    			h21 = element("h2");
    			t22 = text("La superficie est ");
    			t23 = text(/*superficie*/ ctx[2]);
    			t24 = space();
    			h22 = element("h2");
    			t25 = text("Votre message ");
    			t26 = text(/*txt*/ ctx[4]);
    			t27 = space();
    			p = element("p");
    			t28 = text(t28_value);
    			attr_dev(label0, "for", "pays");
    			add_location(label0, file$5, 27, 8, 484);
    			attr_dev(input0, "id", "pays");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$5, 28, 8, 529);
    			attr_dev(label1, "for", "population");
    			add_location(label1, file$5, 29, 8, 597);
    			attr_dev(input1, "id", "population");
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$5, 30, 8, 651);
    			attr_dev(label2, "for", "superficie");
    			add_location(label2, file$5, 31, 8, 726);
    			attr_dev(input2, "id", "superficie");
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", "10");
    			attr_dev(input2, "max", "100");
    			add_location(input2, file$5, 32, 8, 780);
    			attr_dev(label3, "for", "txt");
    			add_location(label3, file$5, 33, 8, 880);
    			attr_dev(textarea, "id", "txt");
    			add_location(textarea, file$5, 34, 8, 927);
    			add_location(br0, file$5, 35, 8, 987);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "bg-blue-300 rounded-2xl px-4 h-8");
    			add_location(button, file$5, 36, 8, 1000);
    			attr_dev(form, "class", "");
    			add_location(form, file$5, 26, 4, 435);
    			add_location(br1, file$5, 38, 4, 1108);
    			attr_dev(h1, "class", "mb-4");
    			add_location(h1, file$5, 39, 4, 1117);
    			attr_dev(h20, "class", "mb-4");
    			add_location(h20, file$5, 40, 4, 1165);
    			attr_dev(h21, "class", "mb-4");
    			add_location(h21, file$5, 41, 4, 1218);
    			attr_dev(h22, "class", "mb-4");
    			add_location(h22, file$5, 42, 4, 1275);
    			add_location(p, file$5, 44, 4, 1322);
    			attr_dev(main, "class", "container");
    			add_location(main, file$5, 25, 0, 406);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, form);
    			append_dev(form, label0);
    			append_dev(form, t1);
    			append_dev(form, input0);
    			set_input_value(input0, /*objDataForm*/ ctx[0].pays);
    			append_dev(form, t2);
    			append_dev(form, label1);
    			append_dev(form, t4);
    			append_dev(form, input1);
    			set_input_value(input1, /*objDataForm*/ ctx[0].pop);
    			append_dev(form, t5);
    			append_dev(form, label2);
    			append_dev(form, t7);
    			append_dev(form, input2);
    			set_input_value(input2, /*objDataForm*/ ctx[0].superficie);
    			append_dev(form, t8);
    			append_dev(form, label3);
    			append_dev(form, t10);
    			append_dev(form, textarea);
    			set_input_value(textarea, /*objDataForm*/ ctx[0].txt);
    			append_dev(form, t11);
    			append_dev(form, br0);
    			append_dev(form, t12);
    			append_dev(form, button);
    			append_dev(main, t14);
    			append_dev(main, br1);
    			append_dev(main, t15);
    			append_dev(main, h1);
    			append_dev(h1, t16);
    			append_dev(h1, t17);
    			append_dev(main, t18);
    			append_dev(main, h20);
    			append_dev(h20, t19);
    			append_dev(h20, t20);
    			append_dev(main, t21);
    			append_dev(main, h21);
    			append_dev(h21, t22);
    			append_dev(h21, t23);
    			append_dev(main, t24);
    			append_dev(main, h22);
    			append_dev(h22, t25);
    			append_dev(h22, t26);
    			append_dev(main, t27);
    			append_dev(main, p);
    			append_dev(p, t28);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[7]),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[8]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[8]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[9]),
    					listen_dev(form, "submit", /*handleSubmit*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*objDataForm*/ 1 && input0.value !== /*objDataForm*/ ctx[0].pays) {
    				set_input_value(input0, /*objDataForm*/ ctx[0].pays);
    			}

    			if (dirty & /*objDataForm*/ 1 && to_number(input1.value) !== /*objDataForm*/ ctx[0].pop) {
    				set_input_value(input1, /*objDataForm*/ ctx[0].pop);
    			}

    			if (dirty & /*objDataForm*/ 1) {
    				set_input_value(input2, /*objDataForm*/ ctx[0].superficie);
    			}

    			if (dirty & /*objDataForm*/ 1) {
    				set_input_value(textarea, /*objDataForm*/ ctx[0].txt);
    			}

    			if (dirty & /*pays*/ 2) set_data_dev(t17, /*pays*/ ctx[1]);
    			if (dirty & /*pop*/ 8) set_data_dev(t20, /*pop*/ ctx[3]);
    			if (dirty & /*superficie*/ 4) set_data_dev(t23, /*superficie*/ ctx[2]);
    			if (dirty & /*txt*/ 16) set_data_dev(t26, /*txt*/ ctx[4]);
    			if (dirty & /*pop*/ 8 && t28_value !== (t28_value = /*pop*/ ctx[3] / 100 + "")) set_data_dev(t28, t28_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Form", slots, []);
    	let objDataForm = { pays: "", superficie: 0, pop: 0, txt: "" };
    	let pays, superficie, pop, txt;

    	const handleSubmit = e => {
    		e.preventDefault();
    		$$invalidate(1, pays = objDataForm.pays);
    		$$invalidate(3, pop = objDataForm.pop);
    		$$invalidate(2, superficie = objDataForm.superficie);
    		$$invalidate(4, txt = objDataForm.txt);
    		$$invalidate(0, objDataForm.pays = "", objDataForm);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Form> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		objDataForm.pays = this.value;
    		$$invalidate(0, objDataForm);
    	}

    	function input1_input_handler() {
    		objDataForm.pop = to_number(this.value);
    		$$invalidate(0, objDataForm);
    	}

    	function input2_change_input_handler() {
    		objDataForm.superficie = to_number(this.value);
    		$$invalidate(0, objDataForm);
    	}

    	function textarea_input_handler() {
    		objDataForm.txt = this.value;
    		$$invalidate(0, objDataForm);
    	}

    	$$self.$capture_state = () => ({
    		objDataForm,
    		pays,
    		superficie,
    		pop,
    		txt,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("objDataForm" in $$props) $$invalidate(0, objDataForm = $$props.objDataForm);
    		if ("pays" in $$props) $$invalidate(1, pays = $$props.pays);
    		if ("superficie" in $$props) $$invalidate(2, superficie = $$props.superficie);
    		if ("pop" in $$props) $$invalidate(3, pop = $$props.pop);
    		if ("txt" in $$props) $$invalidate(4, txt = $$props.txt);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		objDataForm,
    		pays,
    		superficie,
    		pop,
    		txt,
    		handleSubmit,
    		input0_input_handler,
    		input1_input_handler,
    		input2_change_input_handler,
    		textarea_input_handler
    	];
    }

    class Form extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Reactivity.svelte generated by Svelte v3.32.1 */

    const { console: console_1 } = globals;
    const file$6 = "src/Reactivity.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let h10;
    	let t2;
    	let h11;
    	let t3;
    	let t4;
    	let t5;
    	let p;
    	let t6;
    	let t7;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h10 = element("h1");
    			h10.textContent = `Total non réactif = ${/*totalNonReactif*/ ctx[2]}`;
    			t2 = space();
    			h11 = element("h1");
    			t3 = text("Total réactif = ");
    			t4 = text(/*totalReactif*/ ctx[0]);
    			t5 = space();
    			p = element("p");
    			t6 = text(/*array*/ ctx[1]);
    			t7 = space();
    			button = element("button");
    			button.textContent = "Changer ma dépense";
    			add_location(h10, file$6, 31, 4, 691);
    			add_location(h11, file$6, 32, 4, 742);
    			add_location(p, file$6, 33, 4, 786);
    			add_location(button, file$6, 34, 4, 805);
    			add_location(main, file$6, 29, 0, 679);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h10);
    			append_dev(main, t2);
    			append_dev(main, h11);
    			append_dev(h11, t3);
    			append_dev(h11, t4);
    			append_dev(main, t5);
    			append_dev(main, p);
    			append_dev(p, t6);
    			append_dev(main, t7);
    			append_dev(main, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*depenseAdd*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*totalReactif*/ 1) set_data_dev(t4, /*totalReactif*/ ctx[0]);
    			if (dirty & /*array*/ 2) set_data_dev(t6, /*array*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let totalReactif;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Reactivity", slots, []);
    	let val1 = 100;
    	let val2 = 100;
    	let val3 = 100;
    	let array = [1, 2, 3, 4];
    	let array1;
    	let totalNonReactif = val1 + val2 + val3;

    	const depenseAdd = () => {
    		$$invalidate(4, val3 = val3 + 10);

    		//mon tableau non reactif car Svelte comprend que les =
    		/*array.push(5);
    console.log(array);*/
    		$$invalidate(1, array = [...array, 5]);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Reactivity> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		val1,
    		val2,
    		val3,
    		array,
    		array1,
    		totalNonReactif,
    		depenseAdd,
    		totalReactif
    	});

    	$$self.$inject_state = $$props => {
    		if ("val1" in $$props) $$invalidate(5, val1 = $$props.val1);
    		if ("val2" in $$props) $$invalidate(6, val2 = $$props.val2);
    		if ("val3" in $$props) $$invalidate(4, val3 = $$props.val3);
    		if ("array" in $$props) $$invalidate(1, array = $$props.array);
    		if ("array1" in $$props) array1 = $$props.array1;
    		if ("totalNonReactif" in $$props) $$invalidate(2, totalNonReactif = $$props.totalNonReactif);
    		if ("totalReactif" in $$props) $$invalidate(0, totalReactif = $$props.totalReactif);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*val3*/ 16) {
    			$$invalidate(0, totalReactif = val1 + val2 + val3);
    		}

    		if ($$self.$$.dirty & /*val3*/ 16) {
    			//Fonction reactive à peu près similaire à la dépendance dans useEffect de React
    			console.log("Vos dépenses ont changé", val1, val2, val3);
    		}

    		if ($$self.$$.dirty & /*totalReactif*/ 1) {
    			if (totalReactif > 1000) console.log("attention total des dépenses supérieur à 1000 !!!");
    		}
    	};

    	return [totalReactif, array, totalNonReactif, depenseAdd, val3];
    }

    class Reactivity extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Reactivity",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/EventAndFctInline.svelte generated by Svelte v3.32.1 */

    const { console: console_1$1 } = globals;
    const file$7 = "src/EventAndFctInline.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let h10;
    	let t1;
    	let h11;
    	let t3;
    	let form;
    	let t4;
    	let div;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h10 = element("h1");
    			h10.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ad, labore.";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ad, labore.";
    			t3 = space();
    			form = element("form");
    			t4 = space();
    			div = element("div");
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet.";
    			add_location(h10, file$7, 11, 4, 182);
    			add_location(h11, file$7, 13, 4, 317);
    			add_location(form, file$7, 15, 4, 469);
    			attr_dev(p, "class", "bg-blue-300");
    			add_location(p, file$7, 20, 8, 753);
    			attr_dev(div, "class", "bg-yellow-300 box svelte-1yvexvb");
    			add_location(div, file$7, 17, 4, 522);
    			add_location(main, file$7, 10, 0, 171);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h10);
    			append_dev(main, t1);
    			append_dev(main, h11);
    			append_dev(main, t3);
    			append_dev(main, form);
    			append_dev(main, t4);
    			append_dev(main, div);
    			append_dev(div, p);

    			if (!mounted) {
    				dispose = [
    					listen_dev(h10, "mouseenter", /*mouseenter_handler*/ ctx[2], false, false, false),
    					listen_dev(h11, "mouseenter", /*mouseenter_handler_1*/ ctx[3], { once: true }, false, false),
    					listen_dev(form, "submit", prevent_default(submit_handler), false, true, false),
    					listen_dev(p, "click", stop_propagation(/*salutation1*/ ctx[1]), false, false, true),
    					listen_dev(div, "click", /*salutation*/ ctx[0], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const submit_handler = () => {
    	
    };

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EventAndFctInline", slots, []);

    	const salutation = () => {
    		console.log("Espace aérien");
    	};

    	const salutation1 = () => {
    		console.log("Espace aérien1");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<EventAndFctInline> was created with unknown prop '${key}'`);
    	});

    	const mouseenter_handler = () => {
    		console.log("wesh");
    	};

    	const mouseenter_handler_1 = () => {
    		console.log("wesh 1 seul fois");
    	};

    	$$self.$capture_state = () => ({ salutation, salutation1 });
    	return [salutation, salutation1, mouseenter_handler, mouseenter_handler_1];
    }

    class EventAndFctInline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EventAndFctInline",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/ChildToParent.svelte generated by Svelte v3.32.1 */

    const { console: console_1$2 } = globals;

    const file$8 = "src/ChildToParent.svelte";
    const get_contenu_slot_changes = dirty => ({});
    const get_contenu_slot_context = ctx => ({});

    function create_fragment$8(ctx) {
    	let main;
    	let div;
    	let t1;
    	let t2;
    	let t3;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);
    	const contenu_slot_template = /*#slots*/ ctx[2].contenu;
    	const contenu_slot = create_slot(contenu_slot_template, ctx, /*$$scope*/ ctx[1], get_contenu_slot_context);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			div.textContent = "Je suis le composant enfant.";
    			t1 = space();
    			if (default_slot) default_slot.c();
    			t2 = space();
    			if (contenu_slot) contenu_slot.c();
    			t3 = space();
    			button = element("button");
    			button.textContent = "Clique !";
    			add_location(div, file$8, 27, 4, 572);
    			add_location(button, file$8, 30, 4, 661);
    			attr_dev(main, "class", "child svelte-y89l2s");
    			add_location(main, file$8, 26, 0, 547);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(main, t1);

    			if (default_slot) {
    				default_slot.m(main, null);
    			}

    			append_dev(main, t2);

    			if (contenu_slot) {
    				contenu_slot.m(main, null);
    			}

    			append_dev(main, t3);
    			append_dev(main, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*info*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (contenu_slot) {
    				if (contenu_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(contenu_slot, contenu_slot_template, ctx, /*$$scope*/ ctx[1], dirty, get_contenu_slot_changes, get_contenu_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(contenu_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(contenu_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (default_slot) default_slot.d(detaching);
    			if (contenu_slot) contenu_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ChildToParent", slots, ['default','contenu']);
    	const dispatch = createEventDispatcher();

    	const info = () => {
    		dispatch("info-carte", { customtxt: "Panier modifié" });
    	};

    	onMount(() => {
    		console.log("Je me crée");
    	});

    	onDestroy(() => {
    		console.log("Je suis détruit");
    	});

    	beforeUpdate(() => {
    		console.log("Je vais me mettre à jour");
    	});

    	afterUpdate(() => {
    		console.log("Je suis bien à  jour");
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<ChildToParent> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		onDestroy,
    		beforeUpdate,
    		afterUpdate,
    		dispatch,
    		info
    	});

    	return [info, $$scope, slots];
    }

    class ChildToParent extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ChildToParent",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Modal.svelte generated by Svelte v3.32.1 */
    const file$9 = "src/Modal.svelte";

    function create_fragment$9(ctx) {
    	let main;
    	let div1;
    	let div0;
    	let h2;
    	let t1;
    	let p;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Lorem ipsum dolor sit amet.";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Commodi esse, ex inventore itaque, molestias\n                nam\n                nihil numquam obcaecati porro qui saepe suscipit tempore vitae. Tempora?";
    			t3 = space();
    			button = element("button");
    			button.textContent = "X";
    			add_location(h2, file$9, 15, 12, 286);
    			add_location(p, file$9, 16, 12, 337);
    			attr_dev(button, "class", "rounded 2xl:bg-red-600");
    			add_location(button, file$9, 19, 12, 568);
    			attr_dev(div0, "class", "carte svelte-tcnarl");
    			add_location(div0, file$9, 13, 8, 253);
    			attr_dev(div1, "class", "overlay svelte-tcnarl");
    			add_location(div1, file$9, 12, 4, 201);
    			add_location(main, file$9, 11, 0, 190);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div0, t3);
    			append_dev(div0, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*closeModal*/ ctx[0], false, false, false),
    					listen_dev(div1, "click", /*closeModal*/ ctx[0], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, []);
    	const dispatch = createEventDispatcher();

    	const closeModal = () => {
    		dispatch("overlayModal");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		closeModal
    	});

    	return [closeModal];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/Onglet.svelte generated by Svelte v3.32.1 */

    const file$a = "src/Onglet.svelte";

    function create_fragment$a(ctx) {
    	let main;
    	let div5;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div3;
    	let h20;
    	let t5;
    	let p0;
    	let div3_class_value;
    	let t7;
    	let div4;
    	let h21;
    	let t9;
    	let p1;
    	let div4_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div5 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Formule $";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Formule $$$";
    			t3 = space();
    			div3 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Contenu 1";
    			t5 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. A ab amet aperiam harum illo, illum iusto\n                labore\n                nesciunt omnis reprehenderit saepe similique vel vitae. Perferendis!";
    			t7 = space();
    			div4 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Contenu 2";
    			t9 = space();
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam beatae, consequuntur\n                impedit laudantium mollitia nemo odit omnis optio, perspiciatis provident quam rem repellat sapiente\n                vero.";
    			attr_dev(div0, "class", "selecteur s1 svelte-5tuhj7");
    			add_location(div0, file$a, 13, 12, 201);
    			attr_dev(div1, "class", "selecteur s2 svelte-5tuhj7");
    			add_location(div1, file$a, 14, 12, 280);
    			attr_dev(div2, "class", "selecteurs svelte-5tuhj7");
    			add_location(div2, file$a, 12, 8, 164);
    			add_location(h20, file$a, 18, 12, 450);
    			add_location(p0, file$a, 19, 12, 481);

    			attr_dev(div3, "class", div3_class_value = "" + (null_to_empty(/*toggleOnglets*/ ctx[0] === 1
    			? "contenu visible"
    			: "contenu") + " svelte-5tuhj7"));

    			add_location(div3, file$a, 17, 8, 373);
    			add_location(h21, file$a, 25, 12, 798);
    			add_location(p1, file$a, 26, 12, 829);

    			attr_dev(div4, "class", div4_class_value = "" + (null_to_empty(/*toggleOnglets*/ ctx[0] === 2
    			? "contenu visible"
    			: "contenu") + " svelte-5tuhj7"));

    			add_location(div4, file$a, 24, 8, 721);
    			attr_dev(div5, "class", "box-onglets svelte-5tuhj7");
    			add_location(div5, file$a, 11, 4, 130);
    			add_location(main, file$a, 10, 0, 119);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div5);
    			append_dev(div5, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div5, t3);
    			append_dev(div5, div3);
    			append_dev(div3, h20);
    			append_dev(div3, t5);
    			append_dev(div3, p0);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, h21);
    			append_dev(div4, t9);
    			append_dev(div4, p1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*toggleOnglets*/ 1 && div3_class_value !== (div3_class_value = "" + (null_to_empty(/*toggleOnglets*/ ctx[0] === 1
    			? "contenu visible"
    			: "contenu") + " svelte-5tuhj7"))) {
    				attr_dev(div3, "class", div3_class_value);
    			}

    			if (dirty & /*toggleOnglets*/ 1 && div4_class_value !== (div4_class_value = "" + (null_to_empty(/*toggleOnglets*/ ctx[0] === 2
    			? "contenu visible"
    			: "contenu") + " svelte-5tuhj7"))) {
    				attr_dev(div4, "class", div4_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Onglet", slots, []);
    	let toggleOnglets = 1;

    	const toggle = index => {
    		$$invalidate(0, toggleOnglets = index);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Onglet> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => toggle(1);
    	const click_handler_1 = () => toggle(2);
    	$$self.$capture_state = () => ({ toggleOnglets, toggle });

    	$$self.$inject_state = $$props => {
    		if ("toggleOnglets" in $$props) $$invalidate(0, toggleOnglets = $$props.toggleOnglets);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [toggleOnglets, toggle, click_handler, click_handler_1];
    }

    class Onglet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Onglet",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/NavBar.svelte generated by Svelte v3.32.1 */
    const file$b = "src/NavBar.svelte";

    function create_fragment$b(ctx) {
    	let main;
    	let nav;
    	let div1;
    	let div0;
    	let t1;
    	let ul;
    	let li0;
    	let a0;
    	let t3;
    	let li1;
    	let a1;
    	let t5;
    	let li2;
    	let a2;
    	let t7;
    	let li3;
    	let a3;
    	let t9;
    	let li4;
    	let a4;
    	let t11;
    	let li5;
    	let a5;
    	let ul_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			nav = element("nav");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "☰";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "lorem";
    			t3 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "lorem";
    			t5 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "lorem";
    			t7 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "lorem";
    			t9 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "lorem";
    			t11 = space();
    			li5 = element("li");
    			a5 = element("a");
    			a5.textContent = "lorem";
    			add_location(div0, file$b, 25, 12, 454);
    			attr_dev(div1, "class", "logo svelte-1tmfps0");
    			add_location(div1, file$b, 24, 8, 398);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "svelte-1tmfps0");
    			add_location(a0, file$b, 29, 34, 589);
    			attr_dev(li0, "class", "items-nav svelte-1tmfps0");
    			add_location(li0, file$b, 29, 12, 567);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "svelte-1tmfps0");
    			add_location(a1, file$b, 30, 34, 650);
    			attr_dev(li1, "class", "items-nav svelte-1tmfps0");
    			add_location(li1, file$b, 30, 12, 628);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "svelte-1tmfps0");
    			add_location(a2, file$b, 31, 34, 711);
    			attr_dev(li2, "class", "items-nav svelte-1tmfps0");
    			add_location(li2, file$b, 31, 12, 689);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "class", "svelte-1tmfps0");
    			add_location(a3, file$b, 32, 34, 772);
    			attr_dev(li3, "class", "items-nav svelte-1tmfps0");
    			add_location(li3, file$b, 32, 12, 750);
    			attr_dev(a4, "href", "#");
    			attr_dev(a4, "class", "svelte-1tmfps0");
    			add_location(a4, file$b, 33, 34, 833);
    			attr_dev(li4, "class", "items-nav svelte-1tmfps0");
    			add_location(li4, file$b, 33, 12, 811);
    			attr_dev(a5, "href", "#");
    			attr_dev(a5, "class", "svelte-1tmfps0");
    			add_location(a5, file$b, 34, 34, 894);
    			attr_dev(li5, "class", "items-nav svelte-1tmfps0");
    			add_location(li5, file$b, 34, 12, 872);
    			attr_dev(ul, "class", ul_class_value = "" + (null_to_empty(/*toggleMenu*/ ctx[0] ? "list-nav visible" : "list-nav") + " svelte-1tmfps0"));
    			add_location(ul, file$b, 28, 8, 497);
    			attr_dev(nav, "class", "svelte-1tmfps0");
    			add_location(nav, file$b, 23, 4, 384);
    			add_location(main, file$b, 22, 0, 373);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, nav);
    			append_dev(nav, div1);
    			append_dev(div1, div0);
    			append_dev(nav, t1);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t7);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(ul, t9);
    			append_dev(ul, li4);
    			append_dev(li4, a4);
    			append_dev(ul, t11);
    			append_dev(ul, li5);
    			append_dev(li5, a5);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*toggleMenuRes*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*toggleMenu*/ 1 && ul_class_value !== (ul_class_value = "" + (null_to_empty(/*toggleMenu*/ ctx[0] ? "list-nav visible" : "list-nav") + " svelte-1tmfps0"))) {
    				attr_dev(ul, "class", ul_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NavBar", slots, []);
    	let toggleMenu = false;

    	const toggleMenuRes = () => {
    		$$invalidate(0, toggleMenu = !toggleMenu);
    	};

    	const resetMenu = () => {
    		$$invalidate(0, toggleMenu = false);
    	};

    	onMount(() => {
    		const mediaListener = window.matchMedia("(max-width: 650px)");
    		mediaListener.addListener(resetMenu);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		toggleMenu,
    		toggleMenuRes,
    		resetMenu
    	});

    	$$self.$inject_state = $$props => {
    		if ("toggleMenu" in $$props) $$invalidate(0, toggleMenu = $$props.toggleMenu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [toggleMenu, toggleMenuRes];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const text$1 = writable("Hello world depuis le store !");

    /* src/App.svelte generated by Svelte v3.32.1 */

    const { console: console_1$3 } = globals;

    const file$c = "src/App.svelte";

    // (88:12) {#if toggle}
    function create_if_block_1$1(ctx) {
    	let childtoparent;
    	let current;

    	childtoparent = new ChildToParent({
    			props: {
    				$$slots: {
    					default: [create_default_slot],
    					contenu: [create_contenu_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	childtoparent.$on("info-carte", /*fonctionParent*/ ctx[9]);

    	const block = {
    		c: function create() {
    			create_component(childtoparent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(childtoparent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const childtoparent_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				childtoparent_changes.$$scope = { dirty, ctx };
    			}

    			childtoparent.$set(childtoparent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(childtoparent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(childtoparent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(childtoparent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(88:12) {#if toggle}",
    		ctx
    	});

    	return block;
    }

    // (91:20) <div slot="contenu">
    function create_contenu_slot(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. A, consequuntur corporis debitis\n                            eligendi\n                            eum hic minus, nemo, omnis reprehenderit similique totam vero voluptas voluptatibus\n                            voluptatum?";
    			add_location(p, file$c, 91, 24, 2579);
    			attr_dev(div, "slot", "contenu");
    			add_location(div, file$c, 90, 20, 2534);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_contenu_slot.name,
    		type: "slot",
    		source: "(91:20) <div slot=\\\"contenu\\\">",
    		ctx
    	});

    	return block;
    }

    // (89:16) <ChildToParent on:info-carte={fonctionParent}>
    function create_default_slot(ctx) {
    	let h2;
    	let t1;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Mon titre depuis le parent";
    			t1 = space();
    			add_location(h2, file$c, 89, 20, 2478);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(89:16) <ChildToParent on:info-carte={fonctionParent}>",
    		ctx
    	});

    	return block;
    }

    // (106:12) {#if toggleModal}
    function create_if_block$2(ctx) {
    	let modal;
    	let current;
    	modal = new Modal({ $$inline: true });
    	modal.$on("overlayModal", /*handleModal*/ ctx[10]);

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(106:12) {#if toggleModal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let main;
    	let navbar;
    	let t0;
    	let h1;
    	let t1;
    	let t2;
    	let div1;
    	let list1;
    	let t3;
    	let div0;
    	let p;
    	let t4;
    	let t5;
    	let button0;
    	let t7;
    	let button1;
    	let t9;
    	let button2;
    	let t11;
    	let toggle_1;
    	let t12;
    	let else_1;
    	let t13;
    	let each_1;
    	let t14;
    	let div2;
    	let input;
    	let t15;
    	let form;
    	let t16;
    	let reactivity;
    	let t17;
    	let div4;
    	let eventandfctinline;
    	let t18;
    	let div3;
    	let h2;
    	let t20;
    	let button3;
    	let t22;
    	let t23;
    	let div7;
    	let div5;
    	let button4;
    	let t25;
    	let t26;
    	let div6;
    	let onglet;
    	let current;
    	let mounted;
    	let dispose;
    	navbar = new NavBar({ $$inline: true });
    	const list1_spread_levels = [{ class: "p-1" }, { montitre: /*titre*/ ctx[4] }, /*myObject*/ ctx[5]];
    	let list1_props = {};

    	for (let i = 0; i < list1_spread_levels.length; i += 1) {
    		list1_props = assign(list1_props, list1_spread_levels[i]);
    	}

    	list1 = new List1({ props: list1_props, $$inline: true });
    	toggle_1 = new Toggle({ props: { class: "p-1" }, $$inline: true });
    	else_1 = new Else({ props: { class: "p-1" }, $$inline: true });
    	each_1 = new Each({ props: { class: "p-1" }, $$inline: true });
    	input = new Input({ $$inline: true });
    	form = new Form({ $$inline: true });
    	reactivity = new Reactivity({ $$inline: true });
    	eventandfctinline = new EventAndFctInline({ $$inline: true });
    	let if_block0 = /*toggle*/ ctx[2] && create_if_block_1$1(ctx);
    	let if_block1 = /*toggleModal*/ ctx[3] && create_if_block$2(ctx);
    	onglet = new Onglet({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			h1 = element("h1");
    			t1 = text(/*txt*/ ctx[0]);
    			t2 = space();
    			div1 = element("div");
    			create_component(list1.$$.fragment);
    			t3 = space();
    			div0 = element("div");
    			p = element("p");
    			t4 = text(/*compteur*/ ctx[1]);
    			t5 = space();
    			button0 = element("button");
    			button0.textContent = "+1";
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "-1";
    			t9 = space();
    			button2 = element("button");
    			button2.textContent = "Reset";
    			t11 = space();
    			create_component(toggle_1.$$.fragment);
    			t12 = space();
    			create_component(else_1.$$.fragment);
    			t13 = space();
    			create_component(each_1.$$.fragment);
    			t14 = space();
    			div2 = element("div");
    			create_component(input.$$.fragment);
    			t15 = space();
    			create_component(form.$$.fragment);
    			t16 = space();
    			create_component(reactivity.$$.fragment);
    			t17 = space();
    			div4 = element("div");
    			create_component(eventandfctinline.$$.fragment);
    			t18 = space();
    			div3 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Je suis le parent !";
    			t20 = space();
    			button3 = element("button");
    			button3.textContent = "Affiche le gosse";
    			t22 = space();
    			if (if_block0) if_block0.c();
    			t23 = space();
    			div7 = element("div");
    			div5 = element("div");
    			button4 = element("button");
    			button4.textContent = "Affiche le modal";
    			t25 = space();
    			if (if_block1) if_block1.c();
    			t26 = space();
    			div6 = element("div");
    			create_component(onglet.$$.fragment);
    			add_location(h1, file$c, 64, 4, 1628);
    			add_location(p, file$c, 67, 25, 1766);
    			add_location(button0, file$c, 68, 12, 1796);
    			add_location(button1, file$c, 69, 12, 1849);
    			add_location(button2, file$c, 70, 12, 1902);
    			attr_dev(div0, "class", "p-1");
    			add_location(div0, file$c, 67, 8, 1749);
    			attr_dev(div1, "class", "flex justify-around");
    			add_location(div1, file$c, 65, 4, 1647);
    			attr_dev(div2, "class", "flex justify-around");
    			add_location(div2, file$c, 77, 4, 2059);
    			add_location(h2, file$c, 85, 12, 2252);
    			attr_dev(button3, "class", "my-1");
    			add_location(button3, file$c, 86, 12, 2293);
    			add_location(div3, file$c, 84, 8, 2234);
    			attr_dev(div4, "class", "flex justify-around");
    			add_location(div4, file$c, 82, 4, 2163);
    			attr_dev(button4, "class", "my-1");
    			add_location(button4, file$c, 104, 12, 3036);
    			add_location(div5, file$c, 103, 8, 3018);
    			add_location(div6, file$c, 109, 8, 3232);
    			attr_dev(div7, "class", "flex justify-around");
    			add_location(div7, file$c, 102, 4, 2976);
    			add_location(main, file$c, 62, 0, 1603);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t0);
    			append_dev(main, h1);
    			append_dev(h1, t1);
    			append_dev(main, t2);
    			append_dev(main, div1);
    			mount_component(list1, div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t4);
    			append_dev(div0, t5);
    			append_dev(div0, button0);
    			append_dev(div0, t7);
    			append_dev(div0, button1);
    			append_dev(div0, t9);
    			append_dev(div0, button2);
    			append_dev(div1, t11);
    			mount_component(toggle_1, div1, null);
    			append_dev(div1, t12);
    			mount_component(else_1, div1, null);
    			append_dev(div1, t13);
    			mount_component(each_1, div1, null);
    			append_dev(main, t14);
    			append_dev(main, div2);
    			mount_component(input, div2, null);
    			append_dev(div2, t15);
    			mount_component(form, div2, null);
    			append_dev(div2, t16);
    			mount_component(reactivity, div2, null);
    			append_dev(main, t17);
    			append_dev(main, div4);
    			mount_component(eventandfctinline, div4, null);
    			append_dev(div4, t18);
    			append_dev(div4, div3);
    			append_dev(div3, h2);
    			append_dev(div3, t20);
    			append_dev(div3, button3);
    			append_dev(div3, t22);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(main, t23);
    			append_dev(main, div7);
    			append_dev(div7, div5);
    			append_dev(div5, button4);
    			append_dev(div5, t25);
    			if (if_block1) if_block1.m(div5, null);
    			append_dev(div7, t26);
    			append_dev(div7, div6);
    			mount_component(onglet, div6, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*increment*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*decrement*/ ctx[7], false, false, false),
    					listen_dev(button2, "click", /*reset*/ ctx[8], false, false, false),
    					listen_dev(button3, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(button4, "click", /*handleModal*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*txt*/ 1) set_data_dev(t1, /*txt*/ ctx[0]);

    			const list1_changes = (dirty & /*titre, myObject*/ 48)
    			? get_spread_update(list1_spread_levels, [
    					list1_spread_levels[0],
    					dirty & /*titre*/ 16 && { montitre: /*titre*/ ctx[4] },
    					dirty & /*myObject*/ 32 && get_spread_object(/*myObject*/ ctx[5])
    				])
    			: {};

    			list1.$set(list1_changes);
    			if (!current || dirty & /*compteur*/ 2) set_data_dev(t4, /*compteur*/ ctx[1]);

    			if (/*toggle*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*toggle*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div3, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*toggleModal*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*toggleModal*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div5, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(list1.$$.fragment, local);
    			transition_in(toggle_1.$$.fragment, local);
    			transition_in(else_1.$$.fragment, local);
    			transition_in(each_1.$$.fragment, local);
    			transition_in(input.$$.fragment, local);
    			transition_in(form.$$.fragment, local);
    			transition_in(reactivity.$$.fragment, local);
    			transition_in(eventandfctinline.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(onglet.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(list1.$$.fragment, local);
    			transition_out(toggle_1.$$.fragment, local);
    			transition_out(else_1.$$.fragment, local);
    			transition_out(each_1.$$.fragment, local);
    			transition_out(input.$$.fragment, local);
    			transition_out(form.$$.fragment, local);
    			transition_out(reactivity.$$.fragment, local);
    			transition_out(eventandfctinline.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(onglet.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(list1);
    			destroy_component(toggle_1);
    			destroy_component(else_1);
    			destroy_component(each_1);
    			destroy_component(input);
    			destroy_component(form);
    			destroy_component(reactivity);
    			destroy_component(eventandfctinline);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(onglet);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let txt;

    	//permet de souscrire à un store et mettre à jour des données en cas de changements
    	text$1.subscribe(value => {
    		$$invalidate(0, txt = value);
    	});

    	//permet de modifier les valeur dans le store
    	text$1.set("Lorem ipsus");

    	//Mettre à  jour le store à partir des données du store
    	//storeData.update(value => value + 10) ex 20 si a la base value = 10
    	let titre = "Mes lignesssss";

    	let myObject = {
    		nationality: "english",
    		taille: 170,
    		religion: "protestant",
    		married: false
    	};

    	let compteur = 0;

    	const increment = () => {
    		$$invalidate(1, compteur++, compteur);
    	};

    	const decrement = () => {
    		$$invalidate(1, compteur--, compteur);
    	};

    	const reset = () => {
    		$$invalidate(1, compteur = 0);
    	};

    	const fonctionParent = event => {
    		console.log("Quelque chose a changé" + event.detail.customtxt);
    	};

    	let toggle = false;
    	let toggleModal = false;

    	const handleModal = () => {
    		$$invalidate(3, toggleModal = !toggleModal);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, toggle = !toggle);

    	$$self.$capture_state = () => ({
    		List1,
    		Toggle,
    		Else,
    		Each,
    		Input,
    		Form,
    		Reactivity,
    		EventAndFctInline,
    		ChildToParent,
    		Modal,
    		Onglet,
    		NavBar,
    		storeData: text$1,
    		txt,
    		titre,
    		myObject,
    		compteur,
    		increment,
    		decrement,
    		reset,
    		fonctionParent,
    		toggle,
    		toggleModal,
    		handleModal
    	});

    	$$self.$inject_state = $$props => {
    		if ("txt" in $$props) $$invalidate(0, txt = $$props.txt);
    		if ("titre" in $$props) $$invalidate(4, titre = $$props.titre);
    		if ("myObject" in $$props) $$invalidate(5, myObject = $$props.myObject);
    		if ("compteur" in $$props) $$invalidate(1, compteur = $$props.compteur);
    		if ("toggle" in $$props) $$invalidate(2, toggle = $$props.toggle);
    		if ("toggleModal" in $$props) $$invalidate(3, toggleModal = $$props.toggleModal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		txt,
    		compteur,
    		toggle,
    		toggleModal,
    		titre,
    		myObject,
    		increment,
    		decrement,
    		reset,
    		fonctionParent,
    		handleModal,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
