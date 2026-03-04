const syllabus = {
    html: [
        {
            id: 'basic-structure',
            title: 'Basic Structure',
            description: 'Essential tags like &lt;html&gt;, &lt;head&gt;, &lt;title&gt;, and &lt;body&gt;.',
            initialCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My First Page</title>\n</head>\n<body bgcolor="lavender" text="darkblue">\n  <h1>Hello World!</h1>\n  <p>Welcome to my first web page.</p>\n</body>\n</html>'
        },
        {
            id: 'text-formatting',
            title: 'Text Formatting',
            description: 'Heading levels (h1 to h6), paragraphs, line breaks, and horizontal rules.',
            initialCode: '<h1>Main Heading</h1>\n<h2>Sub Heading</h2>\n<p>This is a paragraph.<br>And a new line.</p>\n<hr>\n<p>Another paragraph after a horizontal rule.</p>'
        },
        {
            id: 'lists',
            title: 'Lists',
            description: 'Unordered (ul), Ordered (ol), and Description (dl) lists.',
            initialCode: '<h3>My Favorite Fruits</h3>\n<ul>\n  <li>Apple</li>\n  <li>Banana</li>\n</ul>\n\n<h3>Steps to Success</h3>\n<ol type="1" start="1">\n  <li>Work Hard</li>\n  <li>Be Consistent</li>\n</ol>\n\n<h3>Definitions</h3>\n<dl>\n  <dt>HTML</dt>\n  <dd>HyperText Markup Language</dd>\n</dl>'
        },
        {
            id: 'multimedia',
            title: 'Multimedia & Links',
            description: 'Images (img), Hyperlinks (a), and Audio/Video.',
            initialCode: '<h3>Links & Images</h3>\n<a href="https://www.google.com" target="_blank">Visit Google</a>\n<br><br>\n<img src="https://via.placeholder.com/150" alt="Placeholder Image" width="150" height="150">\n\n<br><br>\n<h3>Video</h3>\n<video width="320" height="240" controls>\n  <source src="movie.mp4" type="video/mp4">\n  Your browser does not support the video tag.\n</video>'
        },
        {
            id: 'tables',
            title: 'Tables',
            description: 'Complex data representation using table, tr, td, and th.',
            initialCode: '<table border="1">\n  <tr>\n    <th>Name</th>\n    <th>Score</th>\n  </tr>\n  <tr>\n    <td>Alice</td>\n    <td>95</td>\n  </tr>\n  <tr>\n    <td colspan="2">Total Students: 1</td>\n  </tr>\n</table>'
        },
        {
            id: 'forms',
            title: 'Forms',
            description: 'Interactive elements like text boxes, radio buttons, and checkboxes.',
            initialCode: '<form>\n  <label>Name:</label><br>\n  <input type="text" name="name"><br><br>\n\n  <label>Gender:</label><br>\n  <input type="radio" name="gender" value="m"> Male\n  <input type="radio" name="gender" value="f"> Female<br><br>\n\n  <input type="submit" value="Submit">\n</form>'
        }
    ],
    css: [
        {
            id: 'css-intro',
            title: 'Implementation Methods',
            description: 'Three ways to apply styles: Inline, Internal, and External.',
            initialCode: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    h1 {\n      color: teal;\n      text-align: center;\n    }\n  </style>\n</head>\n<body>\n  <h1 style="border: 2px solid coral;">Welcome to CSS</h1>\n  <p>This page uses internal and inline CSS.</p>\n</body>\n</html>'
        },
        {
            id: 'box-model',
            title: 'Box Model',
            description: 'Understanding margin, padding, border, width, and height using div tags.',
            initialCode: '<style>\n  .box {\n    width: 200px;\n    padding: 20px;\n    border: 5px solid blue;\n    margin: 30px;\n    background-color: lightgreen;\n  }\n</style>\n\n<div class="box">\n  I am a box with specific padding and margin!\n</div>'
        },
        {
            id: 'layout',
            title: 'Layout & Position',
            description: 'Introduction to float, position, and basic alignment.',
            initialCode: '<style>\n  .container {\n    width: 100%;\n    overflow: hidden;\n  }\n  .left {\n    float: left;\n    width: 50%;\n    background: lightpink;\n  }\n  .right {\n    float: right;\n    width: 50%;\n    background: lightcyan;\n  }\n</style>\n\n<div class="container">\n  <div class="left">Left Column</div>\n  <div class="right">Right Column</div>\n</div>'
        }
    ]
};
