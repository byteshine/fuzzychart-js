// display probability density of normally distributed fuzzy points in
// an x-y plot
/// <reference lib="dom" />
/// <reference lib="es5" />

// without about_config privacy.file_unique_origin=false ffox refuses import
// but its broken refuses even if false so must cmpile to 1 src fuzcc.bat
//import * from './lib/libnum';
//import {random_normal} from './lib/libnum';

// why ts complains Uint8ClampedArray not generic its in es5
// but dont want anywy, needs to be ImageData
// type ImageData_pixel = Uint8ClampedArray<4>; // = rgba_pixel
type ImageData_pixel = ImageData; // = rgba_pixel

// stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes/24390910
function color_to_rgba( color: string ): ImageData_pixel
{
  // Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
  // color must be a valid canvas fillStyle. This will cover most anything
  // you'd want to use.
  // Examples:
  // colorToRGBA('red')  # [255, 0, 0, 255]
  // colorToRGBA('#f00') # [255, 0, 0, 255]
  let cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
  cvs = document.createElement('canvas');
  cvs.height = 1;
  cvs.width = 1;
  ctx = cvs.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  //return ctx.getImageData(0, 0, 1, 1).data;
  return ctx.getImageData(0, 0, 1, 1);
}

function number_to_label_string( xx: number ): string
{
  let label: string;
  let absxx: number = Math.abs( xx );
  if ( absxx < 1 )
  {
    if ( absxx > .0001 )
      label = xx.toFixed( 5 - Math.log10(xx) ); // ~5 sgnif digits
  }
  else
  {
    if ( absxx < 1e8 )
      label = xx.toFixed( Math.max( 0, 9 - Math.log10(xx) ) ); // ~9 sgnif digits
  }
  if ( label === undefined )
    label = xx.toExponential( 5 );

  // delete trailing zeros but not from exponent or integer:
  if ( label.search( /[eE]/ ) >= 0 )
  {
    if ( label.search( '.' ) >= 0 )
      label = label.replace( /0+([eE])/, '$1' );
    label = label.replace( /[eE][+-]*0$/, '' );
  }
  else
  {
    if ( label.search( '.' ) >= 0 )
      label = label.replace( /0+$/, '' );
  }
  label = label.replace( /\.$/, '' );
  return label;
}
/****
// test:
function test_label( xx: number ): void
{
  for ( let ii = 0; ii < 21; ii++ )
  {
    lib.writeln( number_to_label_string(xx) );
    xx = xx*10;
  }
}
test_label( .000000000123456789 );
test_label( .000000000101 );
lib.writeln( number_to_label_string(0) );
result:
1.23457e-10
1.23457e-9
1.23457e-8
1.23457e-7
1.23457e-6
1.23457e-5
0.00012346
0.0012346
0.012346
0.12346
1.23456789
12.3456789
123.456789
1234.56789
12345.6789
123456.789
1234567.89
12345678.9
1.23457e+8
1.23457e+9
1.23457e+10
1.01e-10
1.01e-9
1.01e-8
1.01e-7
1.01e-6
1.01e-5
0.000101
0.00101
0.0101
0.101
1.01
10.1
101
1010
10100
101000
1010000
10100000
1.01e+8
1.01e+9
1.01e+10
0
****/

// imageData does not know its context, caller must pass
// imageData returned by context.createImageData
// later stdev_x, stdev_y can be arrays
function fuzzy_chart( context: CanvasRenderingContext2D, imageData: ImageData,
                      x_values: number[], y_values: number[],
                      stdev_x: number, stdev_y: number )
{
  //only if need: let canvas = context.canvas;
  let pixel:ImageData_pixel = color_to_rgba( context.strokeStyle as string ); // set color
  let extra_x_sd:number = 1; // how much extra on each end to show in standard deviations, later user specifiabl?
  let extra_y_sd:number = 1; // how much extra on each end to show in standard deviations, later user specifiabl?
  let iterations:number = .007 * imageData.width*imageData.height; // figr later best value
  let x_min:number = Math.min.apply(null,x_values); // minimum of all x_values
  let x_max:number = Math.max.apply(null,x_values);
  let y_min:number = Math.min.apply(null,y_values);
  let y_max:number = Math.max.apply(null,y_values);
  let x_min_border:number = x_min - stdev_x*extra_x_sd;
  let x_max_border:number = x_max + stdev_x*extra_x_sd;
  let y_min_border:number = y_min - stdev_y*extra_y_sd;
  let y_max_border:number = y_max + stdev_y*extra_y_sd;
  let chart_width:number  = x_max_border - x_min_border; // in x_values units
  let chart_height:number = y_max_border - y_min_border; // in y_values units
  let chart_x_base:number = x_min_border; // in x_values units
  let chart_y_base:number = y_min_border; // in y_values units
  let x_min_label:string = number_to_label_string( x_min_border );
  let x_max_label:string = number_to_label_string( x_max_border );
  let y_min_label:string = number_to_label_string( y_min_border );
  let y_max_label:string = number_to_label_string( y_max_border );
  let x_max_label_metrics:TextMetrics = context.measureText( x_max_label );
  let x_max_label_width:number = x_max_label_metrics.width;
  // fontBoundingBoxAscent fontBoundingBoxDescent preferable but not implemented
  let font_height:number = x_max_label_metrics.actualBoundingBoxAscent
                  + x_max_label_metrics.actualBoundingBoxDescent; // pixels for x labels
  let y_min_label_metrics:TextMetrics = context.measureText( y_min_label );
  let y_max_label_metrics:TextMetrics = context.measureText( y_max_label );
  let y_label_width:number = Math.max( y_min_label_metrics.width, y_max_label_metrics.width );
  // to yield pixels to fit in imageData.width imageData.height in pixels:
  let x_scale_factor:number = ( imageData.width-y_label_width ) / chart_width;
  let y_scale_factor:number = ( imageData.height-font_height ) / chart_height;

  // border
  context.beginPath();
  context.rect( y_label_width, 0, imageData.width-y_label_width,
                                  imageData.height-font_height );
  context.stroke();

  // draw probability cloud dots:
  let xx:number, yy:number;
  for ( let ii = 0; ii < iterations; ii++ )
  {
    for ( let vv = 0; vv < y_values.length; vv++ )
    {
      xx = random_normal( x_values[vv], stdev_x ) - chart_x_base;
      yy = random_normal( y_values[vv], stdev_y ) - chart_y_base;
      // y pixels are addressed backward from top to bottom
      context.putImageData( pixel, y_label_width+xx*x_scale_factor,
                            imageData.height - yy*y_scale_factor );
    }
  }

  // draw labels: y pixels are addressed backward from top to bottom
  context.fillText( x_min_label, y_label_width+0, imageData.height );
  context.fillText( x_max_label, imageData.width - x_max_label_width, imageData.height );
  context.fillText( y_min_label, 0, imageData.height - font_height );
  context.fillText( y_max_label, 0, 0 + font_height );
}

