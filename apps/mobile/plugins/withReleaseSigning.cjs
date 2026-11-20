const {withAppBuildGradle}=require('expo/config-plugins');
const BEGIN='// @generated begin kymzi-release-signing';
const END='// @generated end kymzi-release-signing';
function applySigning(source){
 const start=source.indexOf(BEGIN),end=source.indexOf(END);
 if(start!==-1){if(end<start)throw new Error('Incomplete Kymzi signing block in build.gradle.');source=source.slice(0,start)+source.slice(end+END.length);}
 return source.trimEnd()+`\n\n${BEGIN}
// Upload-key values live in the build process environment, never in source.
android {
    signingConfigs {
        kymziRelease {
            def uploadKey = System.getenv("KYMZI_ANDROID_KEYSTORE_PATH")
            if (uploadKey) {
                storeFile file(uploadKey)
                storePassword System.getenv("KYMZI_ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("KYMZI_ANDROID_KEY_ALIAS")
                keyPassword System.getenv("KYMZI_ANDROID_KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        release { signingConfig signingConfigs.kymziRelease }
    }
}
${END}\n`;
}
module.exports=config=>{
 if(process.env.KYMZI_LOCAL_BUILD!=='1')return config;
 return withAppBuildGradle(config,config=>{
 if(config.modResults.language!=='groovy')throw new Error('Kymzi release signing expects Expo’s Groovy app/build.gradle.');
 config.modResults.contents=applySigning(config.modResults.contents);return config;
});
};
module.exports.applySigning=applySigning;
