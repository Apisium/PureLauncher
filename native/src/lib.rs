extern crate zip;

use std::fs;
use std::io::BufReader;
use neon::prelude::*;
use neon::register_module;

fn hello(mut cx: FunctionContext) -> JsResult<JsNumber> {
  Ok(cx.number(2333 as f64))
}

register_module!(mut m, { m.export_function("hello", hello) });
