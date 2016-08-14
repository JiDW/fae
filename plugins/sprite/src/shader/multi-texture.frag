#define TEXTURE_COUNT {{count}}

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;

uniform sampler2D uSamplers[TEXTURE_COUNT];

void main(void)
{
    vec4 color;
    float textureId = floor(vTextureId + 0.5);

    {{texture_choice}}

    gl_FragColor = color * vColor;
}
