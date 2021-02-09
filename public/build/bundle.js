
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
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
    			add_location(li0, file, 12, 8, 190);
    			add_location(li1, file, 13, 8, 215);
    			add_location(li2, file, 14, 8, 240);
    			add_location(li3, file, 15, 8, 265);
    			add_location(li4, file, 16, 8, 290);
    			attr_dev(ul, "class", "text-red-500");
    			add_location(ul, file, 11, 4, 156);
    			add_location(p, file, 19, 4, 322);
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

    /* src/App.svelte generated by Svelte v3.32.1 */
    const file$4 = "src/App.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let list1;
    	let t0;
    	let div;
    	let p;
    	let t1;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let button2;
    	let t8;
    	let toggle;
    	let t9;
    	let else_1;
    	let t10;
    	let each_1;
    	let current;
    	let mounted;
    	let dispose;
    	const list1_spread_levels = [{ class: "p-1" }, { montitre: /*titre*/ ctx[1] }, /*myObject*/ ctx[2]];
    	let list1_props = {};

    	for (let i = 0; i < list1_spread_levels.length; i += 1) {
    		list1_props = assign(list1_props, list1_spread_levels[i]);
    	}

    	list1 = new List1({ props: list1_props, $$inline: true });
    	toggle = new Toggle({ props: { class: "p-1" }, $$inline: true });
    	else_1 = new Else({ props: { class: "p-1" }, $$inline: true });
    	each_1 = new Each({ props: { class: "p-1" }, $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(list1.$$.fragment);
    			t0 = space();
    			div = element("div");
    			p = element("p");
    			t1 = text(/*compteur*/ ctx[0]);
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "+1";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "-1";
    			t6 = space();
    			button2 = element("button");
    			button2.textContent = "Reset";
    			t8 = space();
    			create_component(toggle.$$.fragment);
    			t9 = space();
    			create_component(else_1.$$.fragment);
    			t10 = space();
    			create_component(each_1.$$.fragment);
    			add_location(p, file$4, 32, 21, 656);
    			add_location(button0, file$4, 33, 8, 682);
    			add_location(button1, file$4, 34, 8, 731);
    			add_location(button2, file$4, 35, 8, 780);
    			attr_dev(div, "class", "p-1");
    			add_location(div, file$4, 32, 4, 639);
    			attr_dev(main, "class", "flex justify-around");
    			add_location(main, file$4, 30, 0, 543);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(list1, main, null);
    			append_dev(main, t0);
    			append_dev(main, div);
    			append_dev(div, p);
    			append_dev(p, t1);
    			append_dev(div, t2);
    			append_dev(div, button0);
    			append_dev(div, t4);
    			append_dev(div, button1);
    			append_dev(div, t6);
    			append_dev(div, button2);
    			append_dev(main, t8);
    			mount_component(toggle, main, null);
    			append_dev(main, t9);
    			mount_component(else_1, main, null);
    			append_dev(main, t10);
    			mount_component(each_1, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*increment*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*decrement*/ ctx[4], false, false, false),
    					listen_dev(button2, "click", /*reset*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const list1_changes = (dirty & /*titre, myObject*/ 6)
    			? get_spread_update(list1_spread_levels, [
    					list1_spread_levels[0],
    					dirty & /*titre*/ 2 && { montitre: /*titre*/ ctx[1] },
    					dirty & /*myObject*/ 4 && get_spread_object(/*myObject*/ ctx[2])
    				])
    			: {};

    			list1.$set(list1_changes);
    			if (!current || dirty & /*compteur*/ 1) set_data_dev(t1, /*compteur*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list1.$$.fragment, local);
    			transition_in(toggle.$$.fragment, local);
    			transition_in(else_1.$$.fragment, local);
    			transition_in(each_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list1.$$.fragment, local);
    			transition_out(toggle.$$.fragment, local);
    			transition_out(else_1.$$.fragment, local);
    			transition_out(each_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(list1);
    			destroy_component(toggle);
    			destroy_component(else_1);
    			destroy_component(each_1);
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
    	validate_slots("App", slots, []);
    	let titre = "Mes lignesssss";

    	let myObject = {
    		nationality: "english",
    		taille: 170,
    		religion: "protestant",
    		married: false
    	};

    	let compteur = 0;

    	const increment = () => {
    		$$invalidate(0, compteur++, compteur);
    	};

    	const decrement = () => {
    		$$invalidate(0, compteur--, compteur);
    	};

    	const reset = () => {
    		$$invalidate(0, compteur = 0);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		List1,
    		Toggle,
    		Else,
    		Each,
    		titre,
    		myObject,
    		compteur,
    		increment,
    		decrement,
    		reset
    	});

    	$$self.$inject_state = $$props => {
    		if ("titre" in $$props) $$invalidate(1, titre = $$props.titre);
    		if ("myObject" in $$props) $$invalidate(2, myObject = $$props.myObject);
    		if ("compteur" in $$props) $$invalidate(0, compteur = $$props.compteur);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [compteur, titre, myObject, increment, decrement, reset];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
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
