const path = require('path')
const fs = require('fs-extra')
const remark = require('remark')
const toc = require('remark-toc')

const mdPath = path.resolve(__dirname, '../blogs/00001_javascript_mern_stack_guide.md')
remark()
    .use(toc, { tight: true })
    .process(
        fs.readFileSync(mdPath, 'utf8'),
        function(err, file) {
            fs.writeFile(mdPath, String(file))
        },
    )
