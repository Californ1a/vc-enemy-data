interface AssetMeta {
	fileFormatVersion:    number;
	guid:                 string;
	timeCreated:          number;
	licenseType:          string;
	NativeFormatImporter: NativeFormatImporter;
}

interface NativeFormatImporter {
	externalObjects:    Object;
	mainObjectFileID:   number;
	userData:           unknown;
	assetBundleName:    unknown;
	assetBundleVariant: unknown;
}
